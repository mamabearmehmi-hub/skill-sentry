import { readdirSync, readFileSync, statSync, lstatSync } from "fs";
import { join, relative, extname, basename } from "path";
import type { AuditFinding, SecurityRule } from "../lib/types";
import { SECURITY_RULES } from "../lib/constants";

/** Directories to skip during scanning. */
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
  "__pycache__",
  "__tests__",
  "test",
  "tests",
  "fixtures",
  "__fixtures__",
  "__mocks__",
  ".paul",
  ".github",
]);

/** Maximum file size to scan (1MB). Skip binary/large files. */
const MAX_FILE_SIZE = 1_048_576;

/** Severity ordering for sorting findings. */
const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

/**
 * Recursively walk a directory and collect all file paths.
 * Skips excluded directories, symlinks, and files over MAX_FILE_SIZE.
 */
function walkDirectory(dir: string, rootDir: string): string[] {
  const files: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    // Skip symlinks
    try {
      if (lstatSync(fullPath).isSymbolicLink()) continue;
    } catch {
      continue;
    }

    const stat = statSync(fullPath, { throwIfNoEntry: false });
    if (!stat) continue;

    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      files.push(...walkDirectory(fullPath, rootDir));
    } else if (stat.isFile()) {
      if (stat.size > MAX_FILE_SIZE) continue;
      files.push(relative(rootDir, fullPath));
    }
  }

  return files;
}

/**
 * Check if a file path matches a rule's fileTargets glob pattern.
 * Supports:
 *   - "package.json" → exact filename match at any depth
 *   - "**\/*.ts"     → any .ts file in any directory
 */
function matchesGlob(filePath: string, pattern: string): boolean {
  // Exact filename match (e.g., "package.json")
  if (!pattern.includes("*")) {
    return basename(filePath) === pattern;
  }

  // Glob pattern like "**/*.ts" — match by extension
  const globMatch = pattern.match(/\*\*\/\*(\.\w+)$/);
  if (globMatch) {
    return extname(filePath) === globMatch[1];
  }

  return false;
}

/**
 * Find the 1-indexed line number of a match position within file content.
 */
function findLineNumber(content: string, matchIndex: number): number {
  let line = 1;
  for (let i = 0; i < matchIndex && i < content.length; i++) {
    if (content[i] === "\n") line++;
  }
  return line;
}

/**
 * Apply a single security rule against file content.
 * Returns all findings for this rule in this file.
 */
function applyRule(
  rule: SecurityRule,
  filePath: string,
  content: string
): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // Use a global copy of the pattern to find all matches
  const globalPattern = new RegExp(rule.pattern.source, "g");
  let match: RegExpExecArray | null;

  while ((match = globalPattern.exec(content)) !== null) {
    const matchText = match[0];
    findings.push({
      ruleId: rule.id,
      severity: rule.severity,
      file: filePath,
      line: findLineNumber(content, match.index),
      match: matchText.length > 200 ? matchText.slice(0, 200) + "…" : matchText,
      message: rule.description,
      score: rule.score,
    });

    // Prevent infinite loops on zero-length matches
    if (match.index === globalPattern.lastIndex) {
      globalPattern.lastIndex++;
    }
  }

  return findings;
}

/**
 * Scan a cloned repository directory against all security rules.
 * Returns findings sorted by severity (CRITICAL first).
 *
 * This function is stateless — it reads files and returns data.
 */
export function scanRepository(repoDir: string): AuditFinding[] {
  const allFiles = walkDirectory(repoDir, repoDir);
  const findings: AuditFinding[] = [];

  // Cache file contents to avoid re-reading
  const contentCache = new Map<string, string>();

  for (const rule of SECURITY_RULES) {
    // Find files matching this rule's targets
    const matchingFiles = allFiles.filter((filePath) =>
      rule.fileTargets.some((glob) => matchesGlob(filePath, glob))
    );

    for (const filePath of matchingFiles) {
      // Read file content (cached)
      let content = contentCache.get(filePath);
      if (content === undefined) {
        try {
          content = readFileSync(join(repoDir, filePath), "utf-8");
          contentCache.set(filePath, content);
        } catch {
          continue; // Skip unreadable files
        }
      }

      findings.push(...applyRule(rule, filePath, content));
    }
  }

  // Sort by severity (CRITICAL first)
  findings.sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );

  return findings;
}

/**
 * Count findings grouped by severity level.
 */
export function countFindingsBySeverity(findings: AuditFinding[]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
} {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const finding of findings) {
    const key = finding.severity.toLowerCase() as keyof typeof counts;
    if (key in counts) {
      counts[key]++;
    }
  }
  return counts;
}

/**
 * Count total scannable files in a repo directory.
 * Excludes skipped directories and oversized files.
 */
export function countScannableFiles(repoDir: string): number {
  return walkDirectory(repoDir, repoDir).length;
}

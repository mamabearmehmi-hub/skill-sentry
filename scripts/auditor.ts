import { readFileSync } from "fs";
import { join } from "path";
import type { RegistryEntry } from "../lib/types";
import { MAX_RISK_SCORE } from "../lib/constants";
import { cloneRepo, parseGitHubUrl } from "./clone-repo";
import {
  scanRepository,
  countFindingsBySeverity,
  countScannableFiles,
} from "./scan-files";

/**
 * Read package.json from a repo directory and extract metadata.
 * Returns null values if package.json doesn't exist or can't be parsed.
 */
function readPackageJson(
  repoDir: string
): { description: string | null; packageName: string | null } {
  try {
    const raw = readFileSync(join(repoDir, "package.json"), "utf-8");
    const pkg = JSON.parse(raw) as Record<string, unknown>;
    return {
      description:
        typeof pkg.description === "string" ? pkg.description : null,
      packageName: typeof pkg.name === "string" ? pkg.name : null,
    };
  } catch {
    return { description: null, packageName: null };
  }
}

/**
 * Audit a GitHub repository for security threats.
 *
 * This is the core function of Skill Sentry — completely stateless.
 * It takes a GitHub URL, clones the repo, runs all security rules,
 * and returns a typed RegistryEntry with risk score and findings.
 *
 * The caller decides what to do with the result (write to registry,
 * display in UI, etc.). The auditor has no side effects beyond
 * a temporary clone directory that is always cleaned up.
 *
 * @param url - GitHub repository URL (https://github.com/owner/repo)
 * @returns A fully populated RegistryEntry with scan results
 */
export async function auditRepo(url: string): Promise<RegistryEntry> {
  const { owner, name } = parseGitHubUrl(url);
  const { repoDir, cleanup } = await cloneRepo(url);

  try {
    // Extract metadata from package.json
    const { description, packageName } = readPackageJson(repoDir);

    // Count scannable files
    const scannedFiles = countScannableFiles(repoDir);

    // Run security scan
    const findings = scanRepository(repoDir);

    // Compute risk score: min(100, sum of all finding scores)
    const rawScore = findings.reduce((sum, f) => sum + f.score, 0);
    const riskScore = Math.min(MAX_RISK_SCORE, rawScore);

    // Aggregate findings by severity
    const totalFindings = countFindingsBySeverity(findings);

    // Assemble the registry entry
    const entry: RegistryEntry = {
      owner,
      name,
      url,
      description,
      stars: 0, // GitHub API metadata — enriched by Phase 3 scraper
      topics: [], // GitHub API metadata — enriched by Phase 3 scraper
      lastAuditDate: new Date().toISOString(),
      riskScore,
      findings,
      totalFindings,
      verifiedSafe: riskScore === 0,
      scannedFiles,
      packageName,
    };

    return entry;
  } finally {
    // Always clean up the temp directory, even on error
    await cleanup();
  }
}

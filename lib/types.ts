/**
 * Skill Sentry — Data Contract
 *
 * These types define the shape of all data flowing through the system:
 * the auditor produces AuditFindings, which are stored as RegistryEntries
 * in registry.json, and rendered by the dashboard UI.
 *
 * Changing these types affects Phase 2 (auditor), Phase 3 (actions),
 * Phase 4 (UI), and Phase 5 (submit). Change with care.
 */

/** Severity levels for security findings, ordered by threat level. */
export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

/** Numeric risk score from 0 (safe) to 100 (maximum threat). */
export type RiskScore = number;

/**
 * A security scanning rule definition.
 * Used by the auditor engine (Phase 2) to detect dangerous patterns.
 * Defined in constants.ts and imported by auditor.ts.
 */
export interface SecurityRule {
  /** Unique rule identifier, e.g. "CRIT-001" */
  id: string;
  /** Human-readable rule name, e.g. "Malicious Lifecycle Script" */
  name: string;
  /** Threat severity level */
  severity: SeverityLevel;
  /** Regex pattern to detect the threat */
  pattern: RegExp;
  /** Score added to risk total when this rule matches */
  score: number;
  /** What this rule detects and why it matters */
  description: string;
  /** Glob patterns for files this rule scans, e.g. ["package.json"] or ["**\/*.ts"] */
  fileTargets: string[];
}

/**
 * A single finding from a security audit.
 * Produced by the auditor when a SecurityRule matches.
 */
export interface AuditFinding {
  /** References SecurityRule.id */
  ruleId: string;
  /** Severity inherited from the matched rule */
  severity: SeverityLevel;
  /** Relative file path where the match was found */
  file: string;
  /** Line number of the match, null if not determinable */
  line: number | null;
  /** The matched text, truncated to 200 characters */
  match: string;
  /** Human-readable explanation of the finding */
  message: string;
  /** Score contributed by this finding */
  score: number;
}

/**
 * A single repo entry in the registry.
 * Represents the latest audit result for one MCP skill/server.
 */
export interface RegistryEntry {
  /** GitHub repo owner */
  owner: string;
  /** GitHub repo name */
  name: string;
  /** Full GitHub URL */
  url: string;
  /** Repo description from GitHub */
  description: string | null;
  /** Star count at time of last audit */
  stars: number;
  /** GitHub topics (e.g. ["mcp-server", "claude-skill"]) */
  topics: string[];
  /** ISO 8601 timestamp of last audit */
  lastAuditDate: string;
  /** Computed risk score: min(100, sum of finding scores) */
  riskScore: RiskScore;
  /** All findings from the audit */
  findings: AuditFinding[];
  /** Aggregated finding counts by severity */
  totalFindings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  /** True only when riskScore === 0 */
  verifiedSafe: boolean;
  /** Number of files scanned in the repo */
  scannedFiles: number;
  /** npm package name from package.json, if present */
  packageName: string | null;
}

/**
 * The top-level registry structure stored in public/data/registry.json.
 * This is the entire "database" — one JSON file committed to git.
 */
export interface Registry {
  /** Schema version for forward compatibility */
  version: string;
  /** ISO 8601 timestamp of last registry update */
  lastUpdated: string;
  /** Total number of entries (denormalized for quick reads) */
  totalEntries: number;
  /** All audited repo entries */
  entries: RegistryEntry[];
}

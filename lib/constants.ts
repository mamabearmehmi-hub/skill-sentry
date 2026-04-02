import type { SecurityRule } from "./types";

/**
 * Skill Sentry — Security Heuristic Rules
 *
 * These patterns define what the auditor looks for when scanning repos.
 * Each rule has a regex pattern, severity, score, and file targets.
 *
 * Risk Calculation: RiskScore = min(100, Σ matching rule scores)
 *
 * Rules are ordered by severity: CRITICAL → HIGH → MEDIUM.
 * The auditor (Phase 2) imports this array and applies each rule
 * against the matching file targets.
 */

// ─── CRITICAL Rules (score: 100) ─────────────────────────────────
// These are near-certain indicators of malicious intent.

const CRITICAL_RULES: SecurityRule[] = [
  {
    id: "CRIT-001",
    name: "Malicious Lifecycle Script",
    severity: "CRITICAL",
    pattern:
      /"(?:pre|post)?install"\s*:\s*"[^"]*(?:curl|wget|bash|sh |powershell)[^"]*"/,
    score: 100,
    description:
      "Lifecycle script (preinstall/postinstall/install) executes shell commands. " +
      "This is the #1 vector for npm supply chain attacks — code runs automatically on install.",
    fileTargets: ["package.json"],
  },
  {
    id: "CRIT-002",
    name: "Preinstall Script Present",
    severity: "CRITICAL",
    pattern: /"preinstall"\s*:\s*"[^"]+"/,
    score: 100,
    description:
      "Any preinstall script is suspicious. Legitimate packages almost never need to " +
      "run code before installation. This hook executes before the user can inspect the package.",
    fileTargets: ["package.json"],
  },
];

// ─── HIGH Rules (score: 50) ──────────────────────────────────────
// Dangerous capabilities that could be used for exploitation.

const HIGH_RULES: SecurityRule[] = [
  {
    id: "HIGH-001",
    name: "eval() Usage",
    severity: "HIGH",
    pattern: /\beval\s*\(/,
    score: 50,
    description:
      "eval() executes arbitrary strings as code. In an MCP context, this could " +
      "allow prompt injection to escalate into code execution.",
    fileTargets: ["**/*.ts", "**/*.js", "**/*.mjs"],
  },
  {
    id: "HIGH-002",
    name: "child_process Import",
    severity: "HIGH",
    pattern: /(?:require|import).*['"]child_process['"]/,
    score: 50,
    description:
      "Importing child_process gives the package ability to spawn shell commands. " +
      "MCP servers should not need to execute arbitrary system commands.",
    fileTargets: ["**/*.ts", "**/*.js", "**/*.mjs"],
  },
  {
    id: "HIGH-003",
    name: "Process Execution",
    severity: "HIGH",
    pattern: /\b(?:exec|execSync|spawn|spawnSync)\s*\(/,
    score: 50,
    description:
      "Direct process execution functions (exec, spawn) can run arbitrary commands. " +
      "Combined with user input, this enables remote code execution.",
    fileTargets: ["**/*.ts", "**/*.js", "**/*.mjs"],
  },
  {
    id: "HIGH-004",
    name: "SSH Directory Access",
    severity: "HIGH",
    pattern: /(?:~\/\.ssh|\.ssh\/|id_rsa|id_ed25519|known_hosts)/,
    score: 50,
    description:
      "Accessing SSH keys or known_hosts is a strong indicator of credential theft. " +
      "No legitimate MCP server needs access to SSH configuration.",
    fileTargets: ["**/*.ts", "**/*.js", "**/*.mjs"],
  },
  {
    id: "HIGH-005",
    name: "Sensitive Environment Variable Access",
    severity: "HIGH",
    pattern:
      /process\.env\.(?:[A-Z_]*(?:TOKEN|SECRET|KEY|PASSWORD|CREDENTIAL)[A-Z_]*)/,
    score: 50,
    description:
      "Reading sensitive environment variables (tokens, secrets, keys, passwords) " +
      "suggests data exfiltration. MCP servers should declare required env vars, not silently read secrets.",
    fileTargets: ["**/*.ts", "**/*.js", "**/*.mjs"],
  },
];

// ─── MEDIUM Rules (score: 20) ────────────────────────────────────
// Suspicious patterns that warrant investigation.

const MEDIUM_RULES: SecurityRule[] = [
  {
    id: "MED-001",
    name: "Obfuscated Base64 String",
    severity: "MEDIUM",
    pattern: /['"][A-Za-z0-9+/=]{128,}['"]/,
    score: 20,
    description:
      "Long Base64-encoded strings (>128 chars) may contain obfuscated payloads. " +
      "Legitimate code rarely embeds large encoded blobs inline.",
    fileTargets: ["**/*.ts", "**/*.js", "**/*.mjs"],
  },
  {
    id: "MED-002",
    name: "Unpinned Dependencies",
    severity: "MEDIUM",
    pattern: /"\*"|"latest"/,
    score: 20,
    description:
      "Using '*' or 'latest' as a dependency version means any future version " +
      "will be installed automatically — including compromised ones.",
    fileTargets: ["package.json"],
  },
  {
    id: "MED-003",
    name: "Suspicious Network Target",
    severity: "MEDIUM",
    pattern:
      /(?:raw\.githubusercontent|pastebin\.com|hastebin\.com|transfer\.sh)/,
    score: 20,
    description:
      "Network requests to paste sites or raw GitHub content may indicate " +
      "payload downloading. Legitimate dependencies use npm, not pastebins.",
    fileTargets: ["**/*.ts", "**/*.js", "**/*.mjs"],
  },
  {
    id: "MED-004",
    name: "Dynamic Code Loading",
    severity: "MEDIUM",
    pattern: /(?:require|import)\s*\(\s*[^'"]/,
    score: 20,
    description:
      "Dynamic require/import with variable arguments loads code determined at runtime. " +
      "This can be used to load payloads that static analysis can't detect.",
    fileTargets: ["**/*.ts", "**/*.js", "**/*.mjs"],
  },
];

/** All security rules used by the auditor, ordered by severity. */
export const SECURITY_RULES: SecurityRule[] = [
  ...CRITICAL_RULES,
  ...HIGH_RULES,
  ...MEDIUM_RULES,
];

/** Risk score thresholds for UI display badges. */
export const RISK_THRESHOLDS = {
  safe: 0,
  low: { min: 1, max: 19 },
  medium: { min: 20, max: 49 },
  high: { min: 50, max: 79 },
  critical: { min: 80, max: 100 },
} as const;

/** Maximum possible risk score (capped). */
export const MAX_RISK_SCORE = 100;

/** GitHub topics used to discover MCP repos in the daily scraper. */
export const GITHUB_TOPICS = [
  "mcp-server",
  "mcp-tool",
  "claude-skill",
  "model-context-protocol",
] as const;

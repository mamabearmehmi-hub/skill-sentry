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
    plainEnglish:
      "DO NOT INSTALL. This package runs hidden code the moment you type npm install — " +
      "before you can even look at what's inside. It downloads and executes a script " +
      "from the internet automatically. This is the #1 way malware spreads through npm.",
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
    plainEnglish:
      "DO NOT INSTALL. This package runs code BEFORE you can even see what it does. " +
      "Almost no legitimate package needs this. It's like a delivery driver demanding " +
      "to enter your house before you can check what's in the box.",
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
    plainEnglish:
      "Caution. This package can turn any text into running code. " +
      "A bad actor could trick it into running harmful commands on your computer. " +
      "Legitimate tools almost never need this.",
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
    plainEnglish:
      "Caution. This package can open a terminal on your computer and run any command " +
      "it wants — with YOUR permissions. It could delete files, install malware, " +
      "or steal your data without you seeing anything happen.",
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
    plainEnglish:
      "Caution. This package runs system commands on your computer. " +
      "This is like giving someone the keys to your terminal. They could run " +
      "anything — download files, change settings, or access your private data.",
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
    plainEnglish:
      "DO NOT INSTALL. This package tries to read your SSH keys — the same keys " +
      "that unlock your servers, your GitHub account, and your deployments. " +
      "No Claude skill should ever need to touch these files. This looks like " +
      "credential theft.",
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
    plainEnglish:
      "Caution. This package reads your secret passwords and API tokens from " +
      "your system. If it also has network access, your credentials could be " +
      "sent to someone else's server. Check WHY it needs your secrets.",
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
    plainEnglish:
      "Suspicious. This package contains hidden encoded text — like a secret message " +
      "that gets decoded when the code runs. Legitimate packages don't usually " +
      "hide their code this way. It could be a disguised payload.",
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
    plainEnglish:
      "Risky. This package doesn't lock its dependency versions. That means if " +
      "one of its dependencies gets hacked tomorrow, you'd automatically download " +
      "the hacked version. Good packages always pin their versions.",
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
    plainEnglish:
      "Suspicious. This package downloads code from paste sites or raw URLs " +
      "instead of using normal package managers. This is a common trick to " +
      "sneak in malicious code that doesn't show up in the package itself.",
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
    plainEnglish:
      "Suspicious. This package loads code from an unknown location decided at runtime. " +
      "We can't tell what it will actually run because it depends on a variable. " +
      "This makes it harder to verify the package is safe.",
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

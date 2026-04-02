import type { RegistryEntry, AuditFinding, RiskScore } from "./types";
import { RISK_THRESHOLDS, SECURITY_RULES } from "./constants";
import {
  isVerifiedPublisher,
  getPublisherInfo,
  detectTyposquat,
} from "./verified-publishers";

/**
 * Filter entries by search query (matches owner, name, description, packageName).
 * Client-safe — no Node.js APIs.
 */
export function searchEntries(
  entries: RegistryEntry[],
  query: string
): RegistryEntry[] {
  if (!query.trim()) return entries;
  const q = query.toLowerCase();
  return entries.filter(
    (e) =>
      e.owner.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      (e.description?.toLowerCase().includes(q) ?? false) ||
      (e.packageName?.toLowerCase().includes(q) ?? false)
  );
}

/**
 * Get the risk level label for a given score.
 * Client-safe — no Node.js APIs.
 */
export function getRiskLevel(
  score: number
): "safe" | "low" | "medium" | "high" | "critical" {
  if (score === RISK_THRESHOLDS.safe) return "safe";
  if (score <= RISK_THRESHOLDS.low.max) return "low";
  if (score <= RISK_THRESHOLDS.medium.max) return "medium";
  if (score <= RISK_THRESHOLDS.high.max) return "high";
  return "critical";
}

/**
 * Compute an "impact" rating: how many people are at risk.
 * A high-star repo with threats = high impact (many people exposed).
 * Returns a label + numeric score for sorting.
 */
export function getImpact(entry: RegistryEntry): {
  label: string;
  score: number;
  description: string;
} {
  if (entry.isDemo) {
    return { label: "Demo", score: -1, description: "Example entry for demonstration" };
  }

  if (entry.verifiedSafe) {
    if (entry.stars >= 10000) return { label: "Widely Trusted", score: 0, description: "Popular and verified safe" };
    if (entry.stars >= 100) return { label: "Trusted", score: 0, description: "Used by many and verified safe" };
    return { label: "Safe", score: 0, description: "Verified safe" };
  }

  // Flagged repos — impact scales with stars
  if (entry.stars >= 10000) {
    return {
      label: "High Impact",
      score: 100,
      description: `${entry.stars.toLocaleString()} people may be affected by these findings`,
    };
  }
  if (entry.stars >= 1000) {
    return {
      label: "Notable",
      score: 75,
      description: `${entry.stars.toLocaleString()} users — review findings carefully`,
    };
  }
  if (entry.stars >= 100) {
    return {
      label: "Watch",
      score: 50,
      description: "Growing usage — findings worth reviewing",
    };
  }
  return {
    label: "Low Profile",
    score: 25,
    description: "Few users, but findings still matter",
  };
}

/**
 * Format star count for display (e.g., 51431 → "51.4k")
 */
export function formatStars(stars: number): string {
  if (stars >= 1000) return (stars / 1000).toFixed(stars >= 10000 ? 0 : 1) + "k";
  return String(stars);
}

/**
 * Get the plain English explanation for a finding.
 */
export function getPlainEnglish(finding: AuditFinding): string {
  const rule = SECURITY_RULES.find((r) => r.id === finding.ruleId);
  return rule?.plainEnglish ?? finding.message;
}

/**
 * Get a plain English verdict for a registry entry.
 * This is the "Should I install this?" answer.
 */
export function getVerdict(entry: RegistryEntry): {
  recommendation: "safe" | "caution" | "danger" | "do-not-install" | "verified-publisher" | "typosquat-warning";
  headline: string;
  explanation: string;
} {
  // Check for typosquatting FIRST — this is the most dangerous
  const typosquat = detectTyposquat(entry.owner);
  if (typosquat.isSuspicious && typosquat.similarTo) {
    const realPublisher = getPublisherInfo(typosquat.similarTo);
    return {
      recommendation: "typosquat-warning",
      headline: `Warning — this looks like a fake "${realPublisher?.name ?? typosquat.similarTo}" account`,
      explanation:
        `This repo's owner "${entry.owner}" is suspiciously similar to the verified publisher ` +
        `"${typosquat.similarTo}" (${realPublisher?.name ?? "known org"}). ` +
        `This could be a typosquatting attack — someone impersonating a trusted brand ` +
        `to trick you into installing malicious code. Verify the owner carefully before installing.`,
    };
  }

  // Verified publisher with findings — expected behavior
  if (isVerifiedPublisher(entry.owner) && !entry.verifiedSafe) {
    const publisher = getPublisherInfo(entry.owner);
    return {
      recommendation: "verified-publisher",
      headline: `Verified publisher — ${publisher?.name ?? entry.owner}`,
      explanation:
        `This package is from ${publisher?.name ?? entry.owner}, a verified publisher. ` +
        `${publisher?.reason ?? "This is a known legitimate organization"}. ` +
        `The findings below are expected for this type of tool — ` +
        `for example, a payment SDK will read API keys, and a browser tool will use child_process. ` +
        `These patterns are normal for a verified publisher, not signs of malice.`,
    };
  }

  if (entry.verifiedSafe) {
    const publisher = isVerifiedPublisher(entry.owner) ? getPublisherInfo(entry.owner) : null;
    return {
      recommendation: "safe",
      headline: publisher
        ? `Verified safe — from ${publisher.name}`
        : "Looks safe to install",
      explanation:
        "We scanned every file in this package and found no dangerous patterns. " +
        "No hidden scripts, no credential theft, no suspicious code. " +
        "You can install this with confidence.",
    };
  }

  const hasCritical = entry.totalFindings.critical > 0;
  const hasSSH = entry.findings.some((f) => f.ruleId === "HIGH-004");
  const hasPostinstall = entry.findings.some(
    (f) => f.ruleId === "CRIT-001" || f.ruleId === "CRIT-002"
  );

  if (hasCritical || hasSSH || hasPostinstall) {
    return {
      recommendation: "do-not-install",
      headline: "Do not install this package",
      explanation:
        "We found dangerous patterns that could harm your computer or steal your data. " +
        (hasPostinstall
          ? "This package runs hidden code automatically when you install it. "
          : "") +
        (hasSSH
          ? "This package tries to access your SSH keys and credentials. "
          : "") +
        "Unless you are 100% sure you trust the author and have reviewed the code yourself, " +
        "do not install this.",
    };
  }

  const hasHighEnv = entry.findings.some((f) => f.ruleId === "HIGH-005");
  const hasExec = entry.findings.some(
    (f) => f.ruleId === "HIGH-002" || f.ruleId === "HIGH-003"
  );

  if (hasHighEnv && hasExec) {
    return {
      recommendation: "danger",
      headline: "High risk — review carefully before installing",
      explanation:
        "This package can run commands on your computer AND reads your secret tokens. " +
        "That combination means it could potentially steal your credentials. " +
        "Only install this if you trust the author and understand why it needs these permissions.",
    };
  }

  if (entry.riskScore >= 50) {
    return {
      recommendation: "danger",
      headline: "High risk — review the findings below",
      explanation:
        "We found multiple concerning patterns in this package. " +
        "Some of these might be legitimate (for example, a build tool might need to run commands), " +
        "but you should review each finding below and decide if the explanations make sense " +
        "for what this package claims to do.",
    };
  }

  return {
    recommendation: "caution",
    headline: "Some concerns found — review before installing",
    explanation:
      "We found some patterns that are worth checking. They might be harmless, " +
      "but it's good practice to understand what a package does before trusting it. " +
      "Read through the findings below.",
  };
}

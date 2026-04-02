import { describe, it, expect } from "vitest";
import { resolve } from "path";
import { scanRepository, countFindingsBySeverity } from "../scan-files";
import { parseGitHubUrl } from "../clone-repo";
import { MAX_RISK_SCORE } from "../../lib/constants";

const FIXTURES = resolve(__dirname, "fixtures");
const SAFE_REPO = resolve(FIXTURES, "safe-repo");
const MALICIOUS_REPO = resolve(FIXTURES, "malicious-repo");

// ─── scanRepository: Safe Repo ───────────────────────────────────

describe("scanRepository — safe repo", () => {
  it("produces zero findings for a clean repo", () => {
    const findings = scanRepository(SAFE_REPO);
    expect(findings).toHaveLength(0);
  });

  it("yields riskScore 0 and verifiedSafe true", () => {
    const findings = scanRepository(SAFE_REPO);
    const riskScore = Math.min(
      MAX_RISK_SCORE,
      findings.reduce((sum, f) => sum + f.score, 0)
    );
    expect(riskScore).toBe(0);
    expect(riskScore === 0).toBe(true); // verifiedSafe
  });
});

// ─── scanRepository: Malicious Repo ──────────────────────────────

describe("scanRepository — malicious repo", () => {
  const findings = scanRepository(MALICIOUS_REPO);

  it("detects CRIT-001: malicious lifecycle script", () => {
    expect(findings.some((f) => f.ruleId === "CRIT-001")).toBe(true);
  });

  it("detects HIGH-001: eval() usage", () => {
    expect(findings.some((f) => f.ruleId === "HIGH-001")).toBe(true);
  });

  it("detects HIGH-002: child_process import", () => {
    expect(findings.some((f) => f.ruleId === "HIGH-002")).toBe(true);
  });

  it("detects HIGH-003: exec() process execution", () => {
    expect(findings.some((f) => f.ruleId === "HIGH-003")).toBe(true);
  });

  it("detects HIGH-005: sensitive env var access", () => {
    expect(findings.some((f) => f.ruleId === "HIGH-005")).toBe(true);
  });

  it("detects MED-001: obfuscated base64 string", () => {
    expect(findings.some((f) => f.ruleId === "MED-001")).toBe(true);
  });

  it("detects MED-002: unpinned dependency", () => {
    expect(findings.some((f) => f.ruleId === "MED-002")).toBe(true);
  });

  it("computes capped risk score of 100", () => {
    const rawScore = findings.reduce((sum, f) => sum + f.score, 0);
    const riskScore = Math.min(MAX_RISK_SCORE, rawScore);
    expect(riskScore).toBe(100);
    expect(rawScore).toBeGreaterThan(100); // raw sum exceeds cap
  });

  it("sorts findings by severity: CRITICAL first", () => {
    const severities = findings.map((f) => f.severity);
    const critIdx = severities.indexOf("CRITICAL");
    const highIdx = severities.indexOf("HIGH");
    const medIdx = severities.indexOf("MEDIUM");
    expect(critIdx).toBeLessThan(highIdx);
    expect(highIdx).toBeLessThan(medIdx);
  });

  it("includes line numbers for findings", () => {
    for (const finding of findings) {
      expect(finding.line).toBeTypeOf("number");
      expect(finding.line).toBeGreaterThan(0);
    }
  });

  it("includes file paths for findings", () => {
    const files = new Set(findings.map((f) => f.file));
    expect(files.has("package.json")).toBe(true);
    expect(files.has("src/index.ts")).toBe(true);
  });
});

// ─── countFindingsBySeverity ─────────────────────────────────────

describe("countFindingsBySeverity", () => {
  it("returns correct counts for malicious repo", () => {
    const findings = scanRepository(MALICIOUS_REPO);
    const counts = countFindingsBySeverity(findings);
    expect(counts.critical).toBeGreaterThanOrEqual(1);
    expect(counts.high).toBeGreaterThanOrEqual(3);
    expect(counts.medium).toBeGreaterThanOrEqual(2);
    expect(counts.low).toBe(0);
    expect(counts.info).toBe(0);
  });

  it("returns all zeros for safe repo", () => {
    const findings = scanRepository(SAFE_REPO);
    const counts = countFindingsBySeverity(findings);
    expect(counts).toEqual({
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    });
  });
});

// ─── parseGitHubUrl ──────────────────────────────────────────────

describe("parseGitHubUrl", () => {
  it("parses standard GitHub URL", () => {
    const result = parseGitHubUrl("https://github.com/anthropics/claude-code");
    expect(result).toEqual({ owner: "anthropics", name: "claude-code" });
  });

  it("parses .git suffix URL", () => {
    const result = parseGitHubUrl(
      "https://github.com/anthropics/claude-code.git"
    );
    expect(result).toEqual({ owner: "anthropics", name: "claude-code" });
  });

  it("handles repos with dots and hyphens", () => {
    const result = parseGitHubUrl(
      "https://github.com/my-org/my.cool-repo"
    );
    expect(result).toEqual({ owner: "my-org", name: "my.cool-repo" });
  });

  it("rejects non-GitHub URL", () => {
    expect(() => parseGitHubUrl("https://example.com/foo")).toThrow(
      "Invalid GitHub URL"
    );
  });

  it("rejects empty string", () => {
    expect(() => parseGitHubUrl("")).toThrow("Invalid GitHub URL");
  });
});

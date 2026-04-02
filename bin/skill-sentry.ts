#!/usr/bin/env tsx

import { auditRepo } from "../scripts/auditor";
import { getVerdict, getPlainEnglish, getRiskLevel } from "../lib/registry-utils";

// ─── ANSI Colors ─────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgMagenta: "\x1b[45m",
};

const severityColor: Record<string, string> = {
  CRITICAL: c.bgRed + c.white + c.bold,
  HIGH: c.red + c.bold,
  MEDIUM: c.yellow,
  LOW: c.green,
  INFO: c.dim,
};

function line(char = "─", len = 60) {
  return c.dim + char.repeat(len) + c.reset;
}

function printBanner() {
  console.log();
  console.log(
    `${c.cyan}${c.bold}  ┌─────────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  │       SKILL SENTRY  v0.1            │${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  │  Security scanner for Claude skills  │${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  └─────────────────────────────────────┘${c.reset}`
  );
  console.log();
}

function printUsage() {
  printBanner();
  console.log(`  ${c.bold}Usage:${c.reset}`);
  console.log();
  console.log(
    `    ${c.cyan}npx skill-sentry${c.reset} ${c.dim}<github-url>${c.reset}`
  );
  console.log();
  console.log(`  ${c.bold}Examples:${c.reset}`);
  console.log();
  console.log(
    `    ${c.dim}$${c.reset} npx skill-sentry https://github.com/owner/repo`
  );
  console.log(
    `    ${c.dim}$${c.reset} npx skill-sentry https://github.com/owner/repo --json`
  );
  console.log();
  console.log(`  ${c.bold}Flags:${c.reset}`);
  console.log();
  console.log(`    ${c.cyan}--json${c.reset}           Output raw JSON (for piping/CI)`);
  console.log(`    ${c.cyan}--strict${c.reset}         Exit 1 if any HIGH or CRITICAL finding`);
  console.log(`    ${c.cyan}--threshold${c.reset} ${c.dim}<N>${c.reset}  Exit 1 if risk score >= N (0-100)`);
  console.log(`    ${c.cyan}--help${c.reset}           Show this message`);
  console.log();
  console.log(
    `  ${c.dim}Static analysis only — no code is ever executed.${c.reset}`
  );
  console.log();
}

async function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const helpMode = args.includes("--help") || args.includes("-h");
  const strictMode = args.includes("--strict");
  const thresholdIdx = args.indexOf("--threshold");
  const threshold = thresholdIdx !== -1 ? parseInt(args[thresholdIdx + 1], 10) : null;

  // Find URL — skip flags and flag values
  const flagsWithValues = new Set(["--threshold"]);
  const url = args.find(
    (a, i) =>
      !a.startsWith("--") &&
      !a.startsWith("-") &&
      !(i > 0 && flagsWithValues.has(args[i - 1]))
  );

  if (helpMode || !url) {
    printUsage();
    process.exit(url ? 0 : 1);
  }

  function getExitCode(result: { riskScore: number; totalFindings: { critical: number; high: number } }): number {
    if (strictMode && (result.totalFindings.critical > 0 || result.totalFindings.high > 0)) return 1;
    if (threshold !== null && result.riskScore >= threshold) return 1;
    if (!strictMode && threshold === null && result.riskScore > 0) return 1;
    return 0;
  }

  if (jsonMode) {
    // Raw JSON mode — pipe-friendly
    try {
      const result = await auditRepo(url);
      console.log(JSON.stringify(result, null, 2));
      process.exit(getExitCode(result));
    } catch (error) {
      console.error(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        })
      );
      process.exit(2);
    }
    return;
  }

  // Pretty mode
  printBanner();
  console.log(`  ${c.dim}Scanning:${c.reset} ${c.bold}${url}${c.reset}`);
  console.log(`  ${c.dim}Cloning and analyzing...${c.reset}`);
  console.log();

  try {
    const result = await auditRepo(url);
    const verdict = getVerdict(result);
    const level = getRiskLevel(result.riskScore);

    // ─── Verdict ───
    console.log(line("═"));

    const verdictColors: Record<string, string> = {
      safe: c.bgGreen + c.white + c.bold,
      caution: c.bgYellow + c.white + c.bold,
      danger: c.bgRed + c.white + c.bold,
      "do-not-install": c.bgRed + c.white + c.bold,
      "verified-publisher": c.bgMagenta + c.white + c.bold,
      "typosquat-warning": c.bgRed + c.white + c.bold,
    };

    const verdictColor = verdictColors[verdict.recommendation] ?? c.bold;
    console.log();
    console.log(`  ${verdictColor} ${verdict.headline.toUpperCase()} ${c.reset}`);
    console.log();
    console.log(`  ${c.white}${verdict.explanation}${c.reset}`);
    console.log();

    // ─── Score ───
    const scoreColor =
      level === "safe"
        ? c.green
        : level === "low"
          ? c.green
          : level === "medium"
            ? c.yellow
            : c.red;

    console.log(
      `  ${c.dim}Risk Score:${c.reset}  ${scoreColor}${c.bold}${result.riskScore}/100${c.reset}`
    );
    console.log(
      `  ${c.dim}Files:${c.reset}       ${result.scannedFiles} scanned`
    );
    console.log(
      `  ${c.dim}Findings:${c.reset}    ${result.findings.length} issues`
    );
    if (result.packageName) {
      console.log(
        `  ${c.dim}Package:${c.reset}     ${result.packageName}`
      );
    }
    console.log();

    // ─── Findings ───
    if (result.findings.length > 0) {
      console.log(line());
      console.log(
        `  ${c.bold}FINDINGS${c.reset} ${c.dim}(${result.findings.length})${c.reset}`
      );
      console.log();

      for (const finding of result.findings) {
        const sColor = severityColor[finding.severity] ?? c.reset;
        const plain = getPlainEnglish(finding);

        console.log(
          `  ${sColor}${finding.severity}${c.reset} ${c.dim}${finding.ruleId}${c.reset}`
        );
        console.log(`  ${c.white}${plain}${c.reset}`);
        console.log(
          `  ${c.cyan}${finding.file}${finding.line ? `:${finding.line}` : ""}${c.reset}`
        );
        console.log();
      }
    } else {
      console.log(line());
      console.log();
      console.log(
        `  ${c.green}${c.bold}✓ No known risk patterns detected${c.reset}`
      );
      console.log(
        `  ${c.dim}All ${result.scannedFiles} files passed 11 security checks.${c.reset}`
      );
      console.log();
    }

    // ─── Summary ───
    console.log(line("═"));
    console.log();
    console.log(
      `  ${c.dim}CRITICAL: ${result.totalFindings.critical}  HIGH: ${result.totalFindings.high}  MEDIUM: ${result.totalFindings.medium}  LOW: ${result.totalFindings.low}${c.reset}`
    );
    console.log();
    console.log(
      `  ${c.dim}Static analysis only — no code was executed.${c.reset}`
    );
    console.log(
      `  ${c.dim}Report: https://skill-sentry.vercel.app/repo/${result.owner}/${result.name}${c.reset}`
    );
    console.log();

    process.exit(getExitCode(result));
  } catch (error) {
    console.log();
    console.log(
      `  ${c.red}${c.bold}ERROR${c.reset} ${error instanceof Error ? error.message : String(error)}`
    );
    console.log();
    process.exit(2);
  }
}

main();

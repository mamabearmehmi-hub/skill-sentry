# Skill Sentry: Project Harness

## 🎯 Vision
A zero-cost, security-first dashboard for auditing Claude MCP Skills.
Architecture: Git-as-a-DB (JSON storage in /public/data).

## 🛠 Tech Stack
- Framework: Next.js 15 (App Router), Tailwind, Shadcn/UI.
- Skills: anthropics/frontend-design (use for all UI tasks).
- Automation: GitHub Actions (Daily Scraper + On-Demand Audit).

## 🛡 Security Heuristics (CRITICAL)
When scanning repos, weight findings as follows:
- 🚩 CRITICAL (Score +100): `preinstall`, `postinstall`, or `install` scripts.
- ⚠️ HIGH (Score +50): Use of `eval()`, `child_process.exec()`, or `fs` access to `~/.ssh`.
- 🔍 MEDIUM (Score +20): Obfuscated Base64 strings (>128 chars), unpinned dependencies.

Risk Calculation: $$RiskScore = \min(100, \sum Findings)$$

## 🔄 Workflow Rules
1. Never run `npm install` on a scanned repo. Use static analysis only.
2. Use the `/frontend-design` skill for creating the Dashboard.
3. Test the "Submit Skill" button using `chrome-devtools` MCP.
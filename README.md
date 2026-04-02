<p align="center">
  <img src="https://img.shields.io/badge/SKILL-SENTRY-00e5a0?style=for-the-badge&labelColor=0a0a0f" alt="Skill Sentry" />
  <img src="https://img.shields.io/npm/v/skill-sentry?style=for-the-badge&color=00e5a0&labelColor=0a0a0f" alt="npm version" />
  <br />
  <em>Scan Claude skills for security threats before you install them.</em>
</p>

<p align="center">
  <a href="#why-i-built-this">Why</a> &middot;
  <a href="#what-it-does">What</a> &middot;
  <a href="#getting-started">Get Started</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#what-this-is--what-it-isnt">Limitations</a> &middot;
  <a href="#contributing">Contribute</a>
</p>

---

## Why I Built This

Every day I discover new skills and MCP servers that make building with Claude feel like a superpower. The community is incredible — people are shipping tools that turn Claude into a design partner, a database manager, a deployment engine.

But here's the thing that kept me up at night: **every one of those skills asks you to run `npx` or `npm install`.**

And that means you're trusting someone else's code to run on your machine. With access to your files. Your environment variables. Your SSH keys. Your tokens.

I'm not a security expert. I'm a builder, just like you. But I know enough to be scared of a `postinstall` script that runs `curl | bash` before you even see what's inside. I've read the stories about supply chain attacks. I've seen what a single malicious package can do.

So I built myself a sentry.

**Skill Sentry scans the code so you don't have to.** It reads every file, checks for dangerous patterns, and gives you a risk score — all without ever executing a single line of the scanned code.

You're welcome to use it. I hope it helps keep us safe, and lets us keep enjoying building beautiful things with Claude.

— **V** | *Just a builder who wanted to feel safe clicking install*

---

## What It Does

**Skill Sentry is a zero-cost, open-source security scanner for the Claude MCP ecosystem.**

It doesn't matter if it's called a "Skill" or an "MCP Server" — if it has a `package.json`, Skill Sentry will scan it.

### The Scanner Checks For:

| Threat Level | What We Look For | Why It Matters |
|:---:|---|---|
| **CRITICAL** | `postinstall` / `preinstall` scripts with shell commands | Code runs automatically before you can inspect it |
| **HIGH** | `eval()`, `child_process`, `exec()`, SSH key access | Gives a package control over your entire system |
| **HIGH** | Reading `process.env.GITHUB_TOKEN` and similar secrets | Your credentials could be stolen silently |
| **MEDIUM** | Obfuscated Base64 blobs, unpinned `"*"` dependencies | Hidden payloads and supply chain risks |
| **MEDIUM** | Network requests to paste sites and raw GitHub URLs | Downloading payloads at runtime |

### Risk Score

Every skill gets a score from **0** (no known risks) to **100** (maximum threat).

```
Risk Score = min(100, sum of all finding scores)
```

- **0** = No known risk patterns detected
- **1-19** = Low risk
- **20-49** = Medium risk (review findings)
- **50-79** = High risk (proceed with caution)
- **80-100** = Critical (do not install)

### Verified Publishers & Typosquat Detection

Known legitimate organizations (Anthropic, Stripe, GitHub, Supabase, etc.) are recognized as **verified publishers**. Their findings are shown but explained as expected behavior — Stripe's toolkit *should* read `STRIPE_API_KEY`.

If a repo owner looks suspiciously similar to a verified publisher (e.g., `stripee` vs `stripe`), the scanner flags it as a **potential typosquat** — someone impersonating a trusted brand.

---

## Features

- **npm CLI** — `npx skill-sentry <url>` scans from any terminal, no install needed
- **Web Dashboard** — Searchable table of all audited skills with interactive filters
- **Instant Scan** — Paste a URL, get results in 5-15 seconds (scans run server-side)
- **Plain English** — Every finding explained in human language, not security jargon
- **Verdict** — Clear recommendation: "No known risks" / "Review carefully" / "Do not install"
- **CI Flags** — `--strict` and `--threshold` for automated pipeline gating
- **Auto-Discover** — Daily scraper finds new MCP repos via GitHub API
- **Zero Cost** — Runs entirely on Vercel free tier + GitHub Actions

---

## Getting Started

### Scan from Your Terminal (no install needed)

```bash
npx skill-sentry https://github.com/owner/repo
```

You'll see a colored report with a plain English verdict:

```
  ┌─────────────────────────────────────┐
  │       SKILL SENTRY  v0.2            │
  │  Security scanner for Claude skills  │
  └─────────────────────────────────────┘

  Scanning: https://github.com/owner/repo
  Cloning and analyzing...

  ════════════════════════════════════════
   NO KNOWN RISK PATTERNS DETECTED
  ════════════════════════════════════════

  Risk Score:  0/100
  Files:       42 scanned
  Findings:    0 issues

  ✓ No known risk patterns detected
  All 42 files passed 11 security checks.
```

**Flags:**
- `--json` — Output raw JSON (for piping to other tools or CI)
- `--strict` — Exit 1 if any HIGH or CRITICAL finding
- `--threshold <N>` — Exit 1 if risk score >= N (0-100)
- `--help` — Show usage

**Exit codes** (useful for CI/CD):
- `0` = no findings
- `1` = findings detected (or threshold exceeded)
- `2` = error (invalid URL, network issue)

**Use in CI:**
```bash
# Block PRs that add dangerous MCP dependencies
npx skill-sentry https://github.com/owner/new-skill --strict || exit 1

# Custom threshold — fail if risk score 50 or above
npx skill-sentry https://github.com/owner/new-skill --threshold 50
```

### Use the Dashboard

Visit the live dashboard and paste any GitHub URL into the submit form. Results appear inline in 5-15 seconds — no page navigation, no waiting for background jobs.

### Run Locally

```bash
git clone https://github.com/mamabearmehmi-hub/skill-sentry.git
cd skill-sentry
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

### Run the Tests

```bash
npm test
```

20 integration tests verify every security rule against real fixture files.

---

## How to Use the Dashboard

### Step 1: Check Before You Install

Someone just shared a cool Claude skill in Slack. Before you run `npx` or `npm install`:

1. Copy the GitHub URL
2. Paste it into the **Submit a Skill for Audit** box
3. Results appear in 5-15 seconds — right there on the page
4. Read the verdict

### Step 2: Read the Verdict

| What You See | What It Means | What To Do |
|:---:|---|---|
| **"No known risk patterns detected"** | None of our 11 detection rules matched | Lower risk — but always review code from unfamiliar authors |
| **"Verified publisher"** | Known org (Stripe, Anthropic, etc.) — findings are expected | Review findings, but these are typically normal for the tool type |
| **"Some concerns found"** | Suspicious patterns detected | Read the findings, use your judgment |
| **"High risk — review carefully"** | Multiple dangerous patterns | Only install if you trust the author AND understand why it needs those permissions |
| **"Do not install"** | Critical threats — auto-executing scripts, credential theft, or SSH key access | Walk away. Do not install this. Tell others. |
| **"Looks like a fake account"** | Repo owner is suspiciously similar to a verified publisher (typosquat) | Very likely an impersonation attack. Do not install. |

### Step 3: Understand the Findings

Each finding is explained in plain English — no security degree needed:

> **Caution.** This package can open a terminal on your computer and run any command it wants — with YOUR permissions. It could delete files, install malware, or steal your data without you seeing anything happen.

Click **"Technical details"** to expand the full breakdown with file paths and line numbers.

---

## Auto-Discovery: The Registry Grows Itself

Skill Sentry has a **daily automated scraper** that:

1. **Runs every day at 06:00 UTC** via GitHub Actions
2. **Searches GitHub** for repos tagged `mcp-server`, `mcp-tool`, `claude-skill`, and `model-context-protocol`
3. **Skips repos already scanned** (no duplicates)
4. **Audits each new repo** against all 11 security rules
5. **Commits results** to the registry automatically
6. **Vercel auto-redeploys** — new skills appear on the dashboard within minutes

The registry grows every single day without anyone lifting a finger. The community also feeds it through the Submit button — creating a growth cycle where the more people use it, the more comprehensive it becomes.

**Current registry:** 128+ skills scanned and growing daily.

---

## "But My Company Already Has SonarQube / Snyk / Checkmarx..."

Good. Keep using them. Skill Sentry fills a different gap.

| Tool | When It Acts | What It Covers | The Gap |
|------|:---:|---|---|
| **SonarQube** | After code is in your repo | Code quality, bugs, security smells in YOUR code | Doesn't scan third-party packages before install |
| **Snyk / Checkmarx** | After `npm install` | Known CVEs in your dependency tree | The malicious `postinstall` already ran by this point |
| **Azure Defender** | At runtime | Threats in deployed infrastructure | Doesn't cover developer machines or local `npx` |
| **Ivanti App Control** | At the endpoint | Whitelists/blocks executables and scripts on managed devices | Doesn't understand npm packages — blocks by binary, not by intent. A `node.exe` running a malicious skill looks the same as a safe one |
| **Skill Sentry** | **Before you install** | **Dangerous patterns in packages you're ABOUT to trust** | **This is the gap** |

Here's the timeline of someone installing a Claude skill:

```
1. Someone shares a skill URL in Slack
2. Developer runs: npx some-mcp-skill         ← Skill Sentry checks HERE
3. npm downloads the package                   ← Ivanti sees node.exe (allowed)
4. postinstall script runs silently            ← Too late. Snyk hasn't scanned yet.
5. Code is in node_modules                     ← NOW Snyk/Checkmarx can see it
6. Developer commits and pushes                ← NOW SonarQube can see it
7. App deploys to production                   ← NOW Azure Defender can see it
```

Steps 3-4 are the kill zone. The malicious code runs **before any enterprise tool gets a chance to look at it.**

**Skill Sentry is the only check at step 2.** Before the download. Before the execution. Before any damage.

---

## How It Works

```
Terminal or Dashboard
        │
        ▼
  ┌──────────────┐
  │ auditRepo()  │  Stateless function: URL in → JSON out
  └──────┬───────┘
         │
  ┌──────▼───────┐
  │  Clone repo  │  git clone --depth 1 (local)
  │  or tarball  │  GitHub API download (Vercel/npx)
  └──────┬───────┘
         │
  ┌──────▼───────┐
  │ Scan files   │  11 regex rules × matching file targets
  │ (static)     │  Records: file, line, match, severity
  └──────┬───────┘
         │
  ┌──────▼───────┐
  │  Risk score  │  min(100, sum of finding scores)
  │  + verdict   │  Checks verified publishers + typosquats
  └──────┬───────┘
         │
  ┌──────▼───────┐
  │   Cleanup    │  Temp directory deleted (always, even on error)
  └──────────────┘
```

**Key principle:** The scanner **never executes** the code it's analyzing. It downloads the files, reads them, runs regex patterns, and deletes them. That's it. Static analysis only.

### Architecture

| Layer | Technology | Cost |
|-------|-----------|------|
| CLI | TypeScript + tsx | Free (npm) |
| Frontend | Next.js 15, Tailwind CSS, Shadcn UI | Free (Vercel) |
| Database | `registry.json` committed to git | Free |
| Scanner | TypeScript + regex (Node.js built-ins only) | Free |
| Automation | GitHub Actions (3 workflows) | Free (public repo) |
| npm package | 22.9KB, 2 production deps (tar, tsx) | Free |

**Total cost to run: $0/month.**

### npm Package — Lightweight by Design

The CLI ships with only **2 production dependencies** (tar + tsx). The web dashboard dependencies (React, Next.js, Tailwind) are dev-only and never downloaded when you run `npx skill-sentry`. Total install size for CLI users: ~14MB.

---

## Project Structure

```
skill-sentry/
├── bin/                          # npm CLI entry point
│   ├── cli.js                    # Node wrapper (loads tsx)
│   └── skill-sentry.ts           # CLI with colored output + flags
├── app/                          # Next.js App Router (dashboard)
│   ├── page.tsx                  # Dashboard
│   ├── api/submit/route.ts       # Scan API (runs auditor directly)
│   ├── api/check/route.ts        # Registry lookup API
│   └── repo/[owner]/[name]/      # Per-repo report pages
├── components/security/          # Dashboard UI components
│   ├── DashboardClient.tsx       # Interactive stats + ticker + table
│   ├── SkillsTable.tsx           # Searchable skills table (desktop + mobile)
│   ├── SubmitSkillForm.tsx       # Submit form with inline results
│   ├── RiskBadge.tsx             # Color-coded risk scores
│   ├── FindingCard.tsx           # Finding with plain English + source link
│   ├── ThreatBar.tsx             # Severity distribution bar
│   ├── SearchFilter.tsx          # Search + filter controls
│   └── ReportHeader.tsx          # Report page header
├── scripts/                      # Scanner engine
│   ├── auditor.ts                # Core: auditRepo(url) → RegistryEntry
│   ├── clone-repo.ts             # Git clone or tarball download + cleanup
│   ├── scan-files.ts             # File walker + regex matcher
│   ├── cli.ts                    # JSON CLI (used by GitHub Actions)
│   ├── scraper.ts                # GitHub topic discovery
│   └── update-registry.ts        # Registry upsert
├── lib/                          # Shared types & logic
│   ├── types.ts                  # TypeScript data contract
│   ├── constants.ts              # 11 security rules with plain English
│   ├── registry.ts               # Server-side registry helpers
│   ├── registry-utils.ts         # Client-safe: verdicts, impact, search
│   └── verified-publishers.ts    # Publisher whitelist + typosquat detection
├── .github/workflows/            # GitHub Actions
│   ├── reusable-auditor.yml      # Core scan workflow (called by others)
│   ├── on-demand-scan.yml        # repository_dispatch trigger
│   └── scheduled-scrape.yml      # Daily discovery cron (06:00 UTC)
└── public/data/
    └── registry.json             # The "database" (128+ entries)
```

---

## What This Is & What It Isn't

**Let me be honest with you.**

Skill Sentry is a **first-pass security scanner**. It's a smoke detector, not a fire brigade.

**What it catches:**
- Malicious `postinstall` / `preinstall` scripts that auto-execute on install
- `child_process` / `exec` / `spawn` usage (can run commands on your machine)
- SSH key access attempts (`~/.ssh`, `id_rsa`, `known_hosts`)
- Credential harvesting (`process.env.GITHUB_TOKEN`, secrets, API keys)
- `eval()` usage (arbitrary code execution)
- Obfuscated Base64 payloads, unpinned dependencies, suspicious network targets
- Typosquatting (fake accounts mimicking known publishers)

**What it cannot catch:**
- Obfuscated or encoded malicious code (e.g., building `eval` from string concatenation)
- Sophisticated supply chain attacks that hide in deep dependency trees
- Threats in compiled binaries or WebAssembly
- Social engineering in documentation or README files
- Zero-day exploits in legitimate dependencies

**What this means for you:**
- A score of **0** means none of our detection rules matched — not that the package is guaranteed safe
- If Skill Sentry says **"do not install"** → take it seriously, something is genuinely wrong
- For critical production systems → combine this with Snyk, SonarQube, Checkmarx, and manual code review

Most npm supply chain attacks are lazy — a `postinstall` script that `curl`s a payload is the #1 vector. Skill Sentry catches those in seconds. That's the most common attack addressed in 30 seconds. The long tail of sophisticated attacks is where enterprise tools and manual review come in.

**Being honest about limitations builds more trust than pretending to be perfect.** I'd rather you know exactly what this tool does than find out the hard way what it doesn't.

---

## How I Built This

I built Skill Sentry in one session using Claude Code (Opus). The full build process — from pain point to published npm package — is documented step by step:

**[Read the full build walkthrough →](docs/HOW-I-BUILT-THIS.md)**

It covers the architecture decisions, what went wrong and how I fixed it, the community feedback that made it better, and principles for building your own tools.

---

## Contributing

I built Skill Sentry because I needed it. If you find it useful, I'd love your help making it better.

**This is my first open-source project**, so I'm learning as I go. Be patient with me, and I'll be patient right back. We're all here because we want to build safely with Claude.

### How to Contribute

1. **Fork the repo** — Click the Fork button on GitHub
2. **Create a branch** — `git checkout -b feature/your-idea`
3. **Make your changes** — Follow the patterns you see in the codebase
4. **Run the tests** — `npm test` (all 20 must pass)
5. **Build successfully** — `npm run build` (must complete without errors)
6. **Open a Pull Request** — Target the `main` branch with a clear description

### What I'd Love Help With

- **More security rules** — See patterns I missed? Add them to `lib/constants.ts`
- **AST parsing** — Moving beyond regex to reduce false positives
- **Better regex** — Some rules might have false positives/negatives
- **UI improvements** — The dashboard can always look better
- **Testing** — More edge cases, more fixtures, more confidence
- **Accessibility** — Make the dashboard usable for everyone

### Ground Rules

- **Be kind.** We're all learning.
- **Keep it simple.** This project is intentionally zero-cost and dependency-light.
- **No code execution.** The scanner must NEVER run scanned code. This is non-negotiable.
- **Test your changes.** If you add a rule, add a test. If you fix a bug, prove it's fixed.
- **One thing at a time.** Small, focused PRs are easier to review than big ones.

### Branch Protection

The `main` branch is protected. All changes go through pull requests with:
- At least 1 review required
- Stale reviews dismissed on new pushes
- No force pushes
- No branch deletion

This isn't bureaucracy — it's a security project. We practice what we preach.

---

## Setting Up for Development

### Prerequisites

- Node.js 20+
- Git
- A GitHub account (for testing the submit flow)

### Environment Variables

Create a `.env.local` file:

```env
# Optional — only needed for the web dashboard's submit button
GH_TOKEN=your_github_personal_access_token

# Optional — defaults to this repo
GITHUB_OWNER=mamabearmehmi-hub
GITHUB_REPO=skill-sentry
```

The CLI (`npx skill-sentry`) does not require any environment variables. It uses `git clone` locally or the GitHub API tarball download (with optional `GH_TOKEN` for higher rate limits).

---

## Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/mamabearmehmi-hub">
        <br />
        <sub><b>V</b></sub>
      </a>
      <br />
      <sub>Creator & Maintainer</sub>
    </td>
    <td align="center">
      <sub><b>You?</b></sub>
      <br />
      <sub><a href="#how-to-contribute">Become a contributor</a></sub>
    </td>
  </tr>
</table>

---

## License

MIT License — use it, fork it, improve it. Just keep building safely.

---

<p align="center">
  <strong>Static analysis only — no code executed. Ever.</strong>
  <br />
  <sub>Built with care by a Claude builder who just wanted to feel safe clicking install.</sub>
</p>

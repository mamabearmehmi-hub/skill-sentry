<p align="center">
  <img src="https://img.shields.io/badge/SKILL-SENTRY-00e5a0?style=for-the-badge&labelColor=0a0a0f" alt="Skill Sentry" />
  <br />
  <em>Safely vet Claude skills before you install them.</em>
</p>

<p align="center">
  <a href="#-why-i-built-this">Why</a> &middot;
  <a href="#-what-it-does">What</a> &middot;
  <a href="#-getting-started">Get Started</a> &middot;
  <a href="#-how-it-works">How It Works</a> &middot;
  <a href="#-contributing">Contribute</a>
</p>

---

## Why I Built This

Every day I discover new skills and MCP servers that make building with Claude feel like a superpower. The community is incredible — people are shipping tools that turn Claude into a design partner, a database manager, a deployment engine.

But here's the thing that kept me up at night: **every one of those skills asks you to run `npx` or `npm install`.**

And that means you're trusting someone else's code to run on your machine. With access to your files. Your environment variables. Your SSH keys. Your tokens.

I'm not a security expert. I'm a builder, just like you. But I know enough to be scared of a `postinstall` script that runs `curl | bash` before you even see what's inside. I've read the stories about supply chain attacks. I've seen what a single malicious package can do.

So I built myself a sentry.

**Skill Sentry scans the code so you don't have to.** It reads every file, checks for dangerous patterns, and gives you a simple risk score — all without ever executing a single line of the scanned code.

You're welcome to use it. I hope it helps keep us safe, and lets us keep enjoying building beautiful things with Claude.

— **V** | *Just a builder who wanted to feel safe clicking install*

---

## What It Does

**Skill Sentry is a zero-cost, open-source security dashboard for the Claude MCP ecosystem.**

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

Every skill gets a score from **0** (verified safe) to **100** (maximum threat).

```
Risk Score = min(100, sum of all finding scores)
```

- **0** = Verified Safe (no dangerous patterns found)
- **1-19** = Low risk
- **20-49** = Medium risk (review findings)
- **50-79** = High risk (proceed with caution)
- **80-100** = Critical (do not install)

---

## Features

- **Browse** — Searchable dashboard of all audited MCP skills
- **Submit** — Paste any GitHub URL to trigger a security scan
- **Report** — Detailed per-repo audit with findings linked to source code lines
- **Plain English** — Every finding explained in human language, not security jargon
- **Verdict** — Clear "Should I install this?" recommendation on every report
- **Auto-Discover** — Daily scraper finds new MCP repos automatically
- **Zero Cost** — Runs entirely on Vercel free tier + GitHub Actions

---

## How to Use the Dashboard

### Step 1: Check Before You Install

Someone just shared a cool Claude skill in Slack. Before you run `npx` or `npm install`:

1. Copy the GitHub URL
2. Paste it into the **Submit a Skill for Audit** box on the dashboard
3. Wait 1-2 minutes for the scan to complete
4. Check the result

### Step 2: Read the Verdict

Every report page gives you a clear answer at the top:

| What You See | What It Means | What To Do |
|:---:|---|---|
| **"Looks safe to install"** | We scanned every file and found nothing dangerous | Go ahead and install |
| **"Some concerns found"** | Minor suspicious patterns detected | Read the findings, use your judgment |
| **"High risk — review carefully"** | Multiple dangerous patterns, like reading your tokens AND running commands | Only install if you trust the author AND understand why it needs those permissions |
| **"Do not install"** | Critical threats found — auto-executing scripts, credential theft, or SSH key access | Walk away. Do not install this. Tell others. |

### Step 3: Understand the Findings

Each finding is explained in plain English — no security degree needed:

> **Caution.** This package can open a terminal on your computer and run any command it wants — with YOUR permissions. It could delete files, install malware, or steal your data without you seeing anything happen.

If you want the technical details, click **"Technical details"** to expand. But the plain English version tells you everything you need to make a decision.

### Step 4: Share the Report

Every report page has a unique URL. If you find something dangerous:
- Share the link with your team
- Post it in the community channel where the skill was recommended
- Help others avoid the same risk

### The Dashboard at a Glance

```
┌─ Stats ──────────────────────────────────────────┐
│  24 Scanned  │  17 Safe  │  Avg Risk: 35  │  6 Critical │
├─ Submit ─────────────────────────────────────────┤
│  [Paste any GitHub URL here...] [Scan Skill]     │
├─ Results ────────────────────────────────────────┤
│  Name          Risk    Findings                   │
│  toolhive      ✅ 0    ████████████ Clean         │
│  plugin-kit-ai 🔴 100  ▓▓▓▒▒░░░░░░ 7 issues      │
│  mcp-server-js ✅ 0    ████████████ Clean         │
│  octoweb       🔴 100  ▓▓▓▓▓▓▓▓▓▒░ 57 issues     │
└──────────────────────────────────────────────────┘
  Click any row → full report with plain English explanations
```

---

## Auto-Discovery: The Registry Grows Itself

You don't have to manually submit every skill. Skill Sentry has a **daily automated scraper** that:

1. **Runs every day at 06:00 UTC** via GitHub Actions
2. **Searches GitHub** for repos tagged `mcp-server`, `mcp-tool`, `claude-skill`, and `model-context-protocol`
3. **Skips repos already scanned** (no duplicates)
4. **Audits each new repo** against all 11 security rules
5. **Commits results** to the registry automatically
6. **Vercel auto-redeploys** — new skills appear on the dashboard within minutes

This means the registry grows every single day without anyone lifting a finger. The community also feeds it through the Submit button — creating a **virtuous cycle** where the more people use it, the more comprehensive it becomes.

**Current registry:** 40+ skills scanned and growing daily.

Want to trigger it manually? If you're a contributor:
```bash
gh workflow run "Daily Scrape" --repo mamabearmehmi-hub/skill-sentry
```

---

## "But My Company Already Has SonarQube / Snyk / Checkmarx..."

Good. Keep using them. Skill Sentry fills a different gap.

| Tool | When It Acts | What It Covers | The Gap |
|------|:---:|---|---|
| **SonarQube** | After code is in your repo | Code quality, bugs, security smells in YOUR code | Doesn't scan third-party packages before install |
| **Snyk / Checkmarx** | After `npm install` | Known CVEs in your dependency tree | The malicious `postinstall` already ran by this point |
| **Azure Defender** | At runtime | Threats in deployed infrastructure | Doesn't cover developer machines or local `npx` |
| **Ivanti App Control** | At the endpoint | Whitelists/blocks executables and scripts on managed devices | Doesn't understand npm packages — blocks by binary, not by intent. A `node.exe` running a malicious skill looks the same as a safe one |
| **Skill Sentry** | **Before you install** | **Malicious intent in packages you're ABOUT to trust** | **This is the gap** |

Each of these tools is excellent at what it does. But look at the timeline of a developer installing a Claude skill:

```
1. Someone shares a skill URL in Slack
2. Developer runs: npx some-mcp-skill         ← Skill Sentry checks HERE
3. npm downloads the package                   ← Ivanti sees node.exe (allowed)
4. postinstall script runs silently            ← Too late. Snyk hasn't scanned yet.
5. Code is in node_modules                     ← NOW Snyk/Checkmarx can see it
6. Developer commits and pushes                ← NOW SonarQube can see it
7. App deploys to production                   ← NOW Azure Defender can see it
```

Steps 3-4 are the kill zone. The malicious code runs **before any enterprise tool gets a chance to look at it.** Ivanti sees `node.exe` executing — which is whitelisted because every developer needs Node. Snyk sees the package — but only after it already ran its `postinstall`. SonarQube sees the code — but only after it's committed.

**Skill Sentry is the only check at step 2.** Before the download. Before the execution. Before any damage.

It's not a replacement for your security stack. It's the missing first step none of them were designed to cover — because the MCP ecosystem is new, and community-built tools installed directly from GitHub didn't exist when those tools were built.

---

## Getting Started

### Use the Dashboard

Visit the live site and paste any GitHub URL into the submit form. You'll get a security report in minutes.

### Run Locally

```bash
# Clone the repo
git clone https://github.com/mamabearmehmi-hub/skill-sentry.git
cd skill-sentry

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

### Scan a Skill from the Command Line

```bash
npx tsx scripts/cli.ts https://github.com/owner/repo
```

This outputs a JSON report to stdout — no web server needed.

### Run the Tests

```bash
npm test
```

20 integration tests verify every security rule against real fixture files.

---

## How It Works

```
                    ┌─────────────────┐
                    │   You paste a   │
                    │   GitHub URL    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  /api/submit    │
                    │  (Next.js API)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  GitHub Action  │
                    │  (repo dispatch)│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  auditor.ts     │
                    │  (static scan)  │
                    │  NO CODE EXEC   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ registry.json   │
                    │ (git-as-a-db)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Dashboard      │
                    │  shows results  │
                    └─────────────────┘
```

**Key principle:** The scanner **never executes** the code it's analyzing. It clones the repo with `git clone --depth 1`, reads the files, runs regex patterns, and deletes the clone. That's it. Static analysis only.

### Architecture

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | Next.js 15, Tailwind CSS, Shadcn UI | Free (Vercel) |
| Database | `registry.json` committed to git | Free |
| Scanner | TypeScript + regex (Node.js built-ins) | Free |
| Automation | GitHub Actions (3 workflows) | Free (public repo) |
| API | Octokit for `repository_dispatch` | Free |

**Total cost to run: $0/month.**

---

## Project Structure

```
skill-sentry/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard
│   ├── api/submit/route.ts       # Submit → GitHub dispatch
│   └── repo/[owner]/[name]/      # Per-repo report pages
├── components/security/          # UI components
│   ├── SkillsTable.tsx           # Searchable skills table
│   ├── SubmitSkillForm.tsx       # Submit URL form
│   ├── RiskBadge.tsx             # Color-coded risk scores
│   ├── FindingCard.tsx           # Individual finding display
│   ├── ThreatBar.tsx             # Severity distribution bar
│   ├── StatsHeader.tsx           # Aggregate statistics
│   ├── SearchFilter.tsx          # Search + filter controls
│   └── ReportHeader.tsx          # Report page header
├── scripts/                      # Backend scripts
│   ├── auditor.ts                # Core: auditRepo(url) → JSON
│   ├── clone-repo.ts             # Shallow git clone + cleanup
│   ├── scan-files.ts             # Regex scanner engine
│   ├── cli.ts                    # CLI entry point
│   ├── scraper.ts                # GitHub topic discovery
│   └── update-registry.ts        # Registry upsert
├── lib/                          # Shared types & constants
│   ├── types.ts                  # TypeScript data contract
│   ├── constants.ts              # 11 security heuristic rules
│   ├── registry.ts               # Server-side registry helpers
│   └── registry-utils.ts         # Client-safe utilities
├── .github/workflows/            # GitHub Actions
│   ├── reusable-auditor.yml      # Core scan workflow
│   ├── on-demand-scan.yml        # Submit button trigger
│   └── scheduled-scrape.yml      # Daily discovery cron
└── public/data/
    └── registry.json             # The "database"
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

**What it cannot catch:**
- Obfuscated or encoded malicious code (e.g., building `eval` from string concatenation)
- Sophisticated supply chain attacks that hide in deep dependency trees
- Threats in compiled binaries or WebAssembly
- Social engineering in documentation or README files
- Zero-day exploits in legitimate dependencies

**What this means for you:**
- If Skill Sentry says **"safe"** → the obvious threats aren't there, but always use your judgment
- If Skill Sentry says **"do not install"** → take it seriously, something is genuinely wrong
- For critical production systems → combine this with Snyk, SonarQube, Checkmarx, and manual code review

Most npm supply chain attacks are lazy — a `postinstall` script that `curl`s a payload is the #1 vector. Skill Sentry catches those in seconds. That's 90% of the risk addressed in 30 seconds. The remaining 10% is where enterprise tools and manual review come in.

**Being honest about limitations builds more trust than pretending to be perfect.** I'd rather you know exactly what this tool does than find out the hard way what it doesn't.

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
- **Better regex** — Some rules might have false positives/negatives
- **UI improvements** — The dashboard can always look better
- **Documentation** — Help others understand how to use and contribute
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
- All tests must pass
- Build must succeed

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
# Required for the Submit button to trigger GitHub Actions
GH_TOKEN=your_github_personal_access_token

# Optional — defaults to this repo
GITHUB_OWNER=mamabearmehmi-hub
GITHUB_REPO=skill-sentry
```

To create a `GH_TOKEN`:
1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate a new token with `repo` and `workflow` scopes
3. Never commit this token to the repo

---

## Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/mamabearmehmi-hub">
        <br />
        <sub><b>Mehmi</b></sub>
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
  <sub>Built with care by someone who is a Claude Builder just wanted to feel safe clicking install.</sub>
</p>

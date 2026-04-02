# Skill Sentry

## What This Is

A zero-cost, open-source security dashboard that audits Claude MCP Skills and MCP Servers before you install them. It bridges the gap between "Skills" and "MCP Servers" — if it has a `package.json`, Skill Sentry scans it. Instead of running `npx` (which executes code), Skill Sentry clones and reads code statically, intercepting malicious scripts before they ever reach your machine.

## Core Value

There are 1000's of Claude skills available — can you guarantee they are safe to download? Safely vet your Claude skills before installing them — without running any code.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 0.0.0 |
| Status | Initializing |
| Last Updated | 2026-04-02 |

## Requirements

### Core Features

- **Browse Dashboard** — Searchable table of all audited MCP skills with risk scores, star counts, and verified-safe badges
- **Submit Skill** — Community submission form: paste a GitHub URL to trigger an on-demand security scan via GitHub Actions `repository_dispatch`
- **View Report** — Detailed per-repo security audit page with findings linked directly to source code lines
- **Auto-Discover** — Daily GitHub Actions scraper finds new repos with `mcp-server` topic via GitHub API
- **Security Engine** — Static analysis scanner scores repos 0-100 using regex-based heuristics (never executes scanned code)

### Validated (Shipped)
- [x] Project scaffolding (Next.js 15 + Shadcn + Tailwind) — Phase 1
- [x] Data contract (TypeScript types for all system data) — Phase 1
- [x] Security heuristic constants (11 regex rules) — Phase 1
- [x] Seeded registry with mock data — Phase 1
- [x] Security scanner engine (`auditor.ts`) — Phase 2
- [x] CLI runner + 20 integration tests — Phase 2
- [x] GitHub Actions (reusable auditor + on-demand scan + daily scraper) — Phase 3
- [x] Registry update script + git-auto-commit — Phase 3
- [x] Dashboard UI (dark industrial aesthetic, search, filter, risk badges) — Phase 4

### Active (In Progress)
- [ ] Submit button with GitHub Actions bridge — Phase 5 next

### Planned (Next)
- [ ] Detailed report pages

### Out of Scope
- Running `npm install` on scanned repos — static analysis only
- Paid services — everything must run on free tiers
- User accounts / authentication — anonymous public dashboard
- Database — Git-as-a-DB only (`registry.json`)

## Target Users

**Primary:** Claude developers who want to use community MCP skills but are worried about security
- Non-security-experts who can't manually audit code
- Developers who want a quick safety check before `npx`
- Community members who discover new skills and want to verify them

**Secondary:** Skill authors who want a "verified safe" badge for credibility

## Context

**Business Context:**
The Claude MCP ecosystem is exploding with skills and servers. There's no centralized security vetting. "Claude Skills" and "MCP Servers" both live in GitHub repos, delivered via npm — the naming is confusing, the trust model is nonexistent. Skill Sentry fills this gap as a community-driven security layer.

**Technical Context:**
Zero-cost architecture using Vercel (free tier) for hosting, GitHub Actions (free tier on public repos) for automation, and a JSON file committed to git as the "database." No external services, no vendor lock-in beyond GitHub + Vercel.

## Constraints

### Technical Constraints
- Zero cost — Vercel free tier, GitHub Actions free tier only
- No code execution — static regex-based analysis only
- Git-as-a-DB — all data in `public/data/registry.json`
- Public GitHub repo required — for free Actions minutes
- `GH_TOKEN` required — for `repository_dispatch` and GitHub API scraping
- Rate limits — GitHub API (5000 req/hr authenticated), Vercel serverless (100k invocations/month free)

### Business Constraints
- Open source (public repo)
- Must be impressive enough to attract viral attention
- Engineering quality must be senior-engineer-star-worthy
- The dashboard UI must be visually distinctive — not generic AI aesthetics

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Vercel deployment | Best free Next.js hosting, auto-deploys from GitHub | 2026-04-02 | Active |
| Git-as-a-DB | Zero cost, no external DB, JSON committed to repo | 2026-04-02 | Active |
| Static analysis only | Never execute untrusted code — safety first | 2026-04-02 | Active |
| GitHub Actions for scanning | Free on public repos, `repository_dispatch` enables submit button | 2026-04-02 | Active |
| Shadcn UI + frontend-design skill | Distinctive UI that avoids generic AI aesthetics | 2026-04-02 | Active |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Submit → Report cycle | < 5 minutes | - | Not started |
| Dashboard load time | < 2s | - | Not started |
| Risk score defensibility | Every score traceable to specific findings | - | Not started |
| Registry growth | Auto-growing via scraper + submissions | - | Not started |
| Engineering quality | Star-worthy open source code | - | Not started |
| UI distinctiveness | Visually unique security aesthetic | - | Not started |

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 15 (App Router) | Latest with RSC support |
| Styling | Tailwind CSS + Shadcn UI | Security aesthetic via frontend-design skill |
| Hosting | Vercel (free tier) | Auto-deploys from GitHub |
| Data | `public/data/registry.json` | Git-as-a-DB, no external storage |
| Automation | GitHub Actions | Daily scraper + on-demand scan |
| GitHub API | Octokit | Repo discovery + `repository_dispatch` |
| Scanner | Custom TypeScript (`auditor.ts`) | Regex-based static analysis |

## Security Heuristics

| Severity | Pattern | Score Impact |
|----------|---------|-------------|
| CRITICAL (+100) | `preinstall`, `postinstall`, `install` lifecycle scripts | Immediate red flag |
| HIGH (+50) | `eval()`, `child_process.exec()`, `fs` access to `~/.ssh` | Dangerous capabilities |
| MEDIUM (+20) | Obfuscated Base64 strings (>128 chars), unpinned dependencies | Suspicious patterns |

**Risk Calculation:** RiskScore = min(100, Σ Findings)

## Specialized Flows

See: .paul/SPECIAL-FLOWS.md

Quick Reference:
- /frontend-design → UI components, pages, security aesthetic (required)
- /review → Code review, scanner logic, API routes (required)
- chrome-devtools → Visual verification of UI and submit flow (phase 4-5)
- gh → GitHub CLI for secrets setup and action testing (phase 3, 5)

---
*Created: 2026-04-02*

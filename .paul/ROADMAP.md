# Roadmap: Skill Sentry

## Overview

Build a zero-cost, open-source security dashboard for the Claude MCP ecosystem. Start with the data contract and scaffolding, build the stateless security scanner, wire up GitHub Actions automation, layer on a distinctive UI, add the community submission bridge, and finish with detailed report pages — creating a self-growing security registry.

## Current Milestone

**v0.1 Initial Release** (v0.1.0)
Status: In progress
Phases: 4 of 6 complete

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with [INSERTED])

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Registry & Scaffolding | 1 | Complete | 2026-04-02 |
| 2 | Security Auditor Engine | 2 | Complete | 2026-04-02 |
| 3 | GitHub Actions & Automation | 2 | Complete | 2026-04-02 |
| 4 | Dashboard UI | 1 | Complete | 2026-04-02 |
| 5 | Submit Button & Dispatch Bridge | 2 | Not started | - |
| 6 | Report Pages & Polish | 2 | Not started | - |

## Phase Details

### Phase 1: Registry & Scaffolding

**Goal:** Initialize Next.js 15 project, define the data contract (TypeScript types), seed the registry, and establish security heuristic constants — the foundation everything else builds on.
**Depends on:** Nothing (first phase)
**Research:** Unlikely (established patterns)

**Scope:**
- Next.js 15 App Router project with Tailwind CSS and Shadcn UI
- `lib/types.ts` — `RegistryEntry`, `AuditFinding`, `SecurityRule` interfaces
- `lib/constants.ts` — regex patterns and security heuristic definitions
- `public/data/registry.json` — seeded with one safe + one malicious mock entry
- Project structure matching the ICM blueprint

**Plans:**
- [x] 01-01: Project scaffolding + types + constants + seeded registry

### Phase 2: Security Auditor Engine

**Goal:** Build `auditor.ts` — a stateless function that takes a GitHub URL, clones the repo (shallow), runs regex-based static analysis, and returns a JSON report with risk score. The brain of Skill Sentry.
**Depends on:** Phase 1 (types and constants)
**Research:** Unlikely (regex + filesystem reads)

**Scope:**
- `scripts/auditor.ts` — stateless: URL in → JSON report out
- Regex scanning of `package.json` lifecycle scripts
- Source code scanning for dangerous patterns (`eval`, `child_process`, `exec`, `~/.ssh`)
- Base64 obfuscation detection
- Unpinned dependency detection
- Risk score calculation: min(100, Σ findings)

**Plans:**
- [x] 02-01: Core auditor engine with all heuristic rules
- [x] 02-02: Auditor CLI runner + integration tests with mock repos

### Phase 3: GitHub Actions & Automation

**Goal:** Create the three-workflow GitHub Actions system: reusable auditor, daily scraper, and on-demand scan. Wire up `git-auto-commit-action` to commit results back to the registry.
**Depends on:** Phase 2 (auditor.ts)
**Research:** Likely (GitHub Actions `repository_dispatch`, `git-auto-commit-action` config)
**Research topics:** `stefanzweifel/git-auto-commit-action` usage, `repository_dispatch` payload structure

**Scope:**
- `.github/workflows/reusable-auditor.yml` — core scanning workflow (called by others)
- `.github/workflows/scheduled-scrape.yml` — daily cron to discover `mcp-server` repos
- `.github/workflows/on-demand-scan.yml` — `repository_dispatch` listener for submit button
- `scripts/scraper.ts` — GitHub API search for new MCP repos
- `git-auto-commit-action` integration for registry updates

**Plans:**
- [x] 03-01: Reusable auditor workflow + on-demand scan workflow
- [x] 03-02: Daily scraper script + scheduled workflow

### Phase 4: Dashboard UI

**Goal:** Build the main dashboard with searchable, filterable table of all audited skills. Distinctive security aesthetic using `/frontend-design` skill. Not generic — this is the marketing surface.
**Depends on:** Phase 1 (types, registry data)
**Research:** Unlikely (Next.js + Shadcn patterns)
**Required Skills:** /frontend-design + chrome-devtools

**Scope:**
- `app/page.tsx` — main dashboard with search, sort, filter
- `components/security/` — risk badge, verified badge, threat indicators
- `components/ui/` — Shadcn components (table, input, badge, card)
- Security-first visual aesthetic (dark theme, threat-level colors)

**Plans:**
- [x] 04-01: Dashboard page + security components + visual polish (consolidated)

### Phase 5: Submit Button & Dispatch Bridge

**Goal:** Build the community submission flow: form → API route → `repository_dispatch` → GitHub Action → registry update → Vercel redeploy. Full end-to-end bridge.
**Depends on:** Phase 3 (on-demand-scan workflow), Phase 4 (dashboard to embed form)
**Research:** Likely (Octokit `repository_dispatch`, Vercel deploy hooks)
**Required Skills:** chrome-devtools + gh

**Scope:**
- `components/SubmitSkillForm.tsx` — URL input form with validation
- `app/api/submit/route.ts` — server action calling `octokit.rest.repos.createDispatchEvent`
- End-to-end integration test: button click → 202 → Action starts → registry updated

**Plans:**
- [ ] 05-01: Submit form component + API route + dispatch bridge
- [ ] 05-02: E2E integration testing with chrome-devtools + gh verification

### Phase 6: Report Pages & Polish

**Goal:** Build per-repo detail pages showing the full security audit with findings linked to source code lines. Final polish and launch readiness.
**Depends on:** Phase 4 (UI patterns), Phase 2 (audit data structure)
**Research:** Unlikely (page routing + data display)

**Scope:**
- `app/repo/[owner]/[name]/page.tsx` — detailed report page
- Finding cards with severity badges and GitHub source links
- Line-linked code references for CRITICAL findings
- SEO metadata for sharing audit reports

**Plans:**
- [ ] 06-01: Report page with finding cards and source links
- [ ] 06-02: SEO metadata + sharing polish + launch readiness

---
*Roadmap created: 2026-04-02*
*Last updated: 2026-04-02*

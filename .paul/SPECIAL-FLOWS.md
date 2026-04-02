# Specialized Flows

## Project-Level Dependencies

| Work Type | Skill/Command | Priority | When Required |
|-----------|---------------|----------|---------------|
| UI components, pages, security aesthetic | /frontend-design | required | When creating any HTML/JSX component or page layout |
| Code review, scanner logic, API routes | /review | required | After completing each phase before UNIFY |

## Phase Overrides

| Phase | Additional Skills | Notes |
|-------|-------------------|-------|
| 2 (Auditor) | /review (Security Focus) | Bulletproof regex and static analysis logic |
| 3 (GitHub Actions) | gh (GitHub CLI) | Automate secrets setup, verify workflow triggers |
| 4 (Dashboard UI) | /frontend-design + chrome-devtools | High-end security aesthetic + visual verification |
| 5 (Submit Button) | chrome-devtools + gh | End-to-end testing of Submit → Action → Redeploy loop |

## Templates & Assets

None configured yet.

## Verification Notes

- **chrome-devtools**: Spawns headless browser to verify button clicks, API responses (200 OK), and layout across viewports
- **gh**: Sets up repo secrets (`GH_TOKEN`), tests `repository_dispatch` events, verifies Action runs
- **Gaps are warnings, not blockers** — documented during UNIFY for continuous improvement

---
*Configured: 2026-04-02*

# Contributing to Skill Sentry

First off, thank you. The fact that you're here means you care about keeping the Claude community safe. That means a lot.

## Quick Start

```bash
# Fork and clone
git clone https://github.com/YOUR-USERNAME/skill-sentry.git
cd skill-sentry

# Install
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Build (must pass before PR)
npm run build
```

## Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-idea
   ```

2. **Make your changes.** Follow the patterns you see in the code.

3. **Test your changes:**
   ```bash
   npm test        # All 20 tests must pass
   npm run build   # Must complete without errors
   npx tsc --noEmit  # No TypeScript errors
   ```

4. **Commit with a clear message:**
   ```bash
   git commit -m "feat: add rule for detecting crypto miners"
   ```

5. **Push and open a PR:**
   ```bash
   git push origin feature/your-idea
   ```
   Then open a Pull Request on GitHub targeting `main`.

## Adding a Security Rule

This is the most impactful contribution you can make. Here's how:

1. **Add the rule** to `lib/constants.ts`:
   ```typescript
   {
     id: "HIGH-006",
     name: "Crypto Mining Detection",
     severity: "HIGH",
     pattern: /crypto(?:night|miner)|stratum\+tcp/,
     score: 50,
     description: "Detects cryptocurrency mining code...",
     plainEnglish: "This package contains crypto mining code that uses your computer's resources...",
     fileTargets: ["**/*.ts", "**/*.js", "**/*.mjs"],
   }
   ```

2. **Add a test fixture** in `scripts/__tests__/fixtures/malicious-repo/`:
   Add the pattern to an existing fixture file or create a new one.

3. **Add a test** in `scripts/__tests__/auditor.test.ts`:
   ```typescript
   it("detects HIGH-006: crypto mining", () => {
     expect(findings.some((f) => f.ruleId === "HIGH-006")).toBe(true);
   });
   ```

4. **Run tests** to verify: `npm test`

## Commit Message Convention

We use simple prefixes:

- `feat:` new feature or security rule
- `fix:` bug fix
- `docs:` documentation changes
- `test:` adding or updating tests
- `refactor:` code changes that don't add features or fix bugs

## The One Rule That Cannot Be Broken

**The scanner must NEVER execute scanned code.**

No `npm install` on target repos. No `eval`. No dynamic imports of scanned files. No running test suites of scanned packages. Static analysis only. Always.

If you're unsure whether your change crosses this line, ask in the PR. We'll figure it out together.

## Questions?

Open an issue. There are no stupid questions, especially about security.

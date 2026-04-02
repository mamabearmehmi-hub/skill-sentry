---
name: New Security Rule
about: Suggest a new pattern the scanner should detect
title: "[Rule] "
labels: enhancement, security-rule
---

**What pattern should we detect?**
Describe the dangerous code pattern.

**Example of the pattern:**
```js
// Paste real or example code that should trigger this rule
```

**Why is this dangerous?**
Explain in plain English what this could do to someone's machine.

**Suggested severity:**
- [ ] CRITICAL (auto-executes, no user action needed)
- [ ] HIGH (dangerous capability — exec, credentials, SSH)
- [ ] MEDIUM (suspicious but might be legitimate)

**Have you seen this in the wild?**
Link to a real repo with this pattern (if you've found one).

---
name: Rollup Native Module Fix
description: How to fix the @rollup/rollup-linux-x64-gnu missing module error on Replit.
---

## Rule
When Vite fails at startup with `Cannot find module @rollup/rollup-linux-x64-gnu`, run:

```bash
npm install --ignore-scripts
```

**Why:** npm has a known bug with optional dependencies (https://github.com/npm/cli/issues/4828). The native Rollup binary can go missing after environment resets. `--ignore-scripts` avoids running postinstall hooks that can interfere.

## How to apply
Restart the workflow after running the command. No code changes needed.

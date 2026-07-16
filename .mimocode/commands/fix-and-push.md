---
description: "Fix errors, improve code, commit, and push to all remotes — a quick single-cycle improvement"
agent: main
---

# Fix and Push

A compact single-cycle workflow: fix errors or make one improvement, verify, commit, and push to all remotes.

## Steps

1. **Check project state**
   - Read `MEMORY.md` for project context and known issues
   - Run `git status` to see current state
   - Run `git log --oneline -5` to see recent commits

2. **Make improvement** (one focused change)
   - Fix a bug, improve code quality, or make one enhancement
   - Keep changes atomic and focused

3. **Verify**
   - Type check: `npx tsc --noEmit` (or project-appropriate command)
   - Lint: `npx eslint .` (or `bun run lint`)
   - Tests: `npm run test:run` (or `bun run test`)
   - Build: `bun run build`

4. **Commit and push**
   - `git add <changed files>`
   - `git commit -m "<type>: <description>"`
   - `git push origin main`
   - Push to additional remotes as needed

5. **Clean up**
   - `git status` — verify clean tree
   - Delete non-main branches if present

## Notes

- Use `$ARGUMENTS` for a description of what to fix/improve
- If no arguments provided, scan for obvious issues (lint warnings, TODO comments, unused imports)
- Timeout: 120s per verification command

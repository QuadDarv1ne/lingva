---
description: "Push current branch to all configured remotes (origin + amvera, or origin + gitverse, etc.)"
agent: main
---

# Push to All Remotes

Push the current branch to all configured remote repositories. Works for any project with multiple remotes.

## Steps

1. **Check git status** — verify working tree is clean and branch is `main`
2. **List remotes** — run `git remote -v` to discover all configured remotes
3. **Push to all remotes** — push to each remote in sequence:
   ```bash
   git push origin main
   ```
   For each additional remote (e.g. `amvera`, `gitverse`, `upstream`), push sequentially:
   ```bash
   git push <remote> main
   ```
4. **Verify** — run `git status` to confirm clean state after push

## Notes

- If working tree is not clean, prompt to commit first or abort
- If a push fails to one remote, report which remote failed and continue with others
- Use `$ARGUMENTS` to specify a custom branch if not `main`
- Timeout: 60s per push command

## Example

User says: `push-all`
→ Push to all remotes on current branch

User says: `push-all feature-xyz`
→ Push branch `feature-xyz` to all remotes

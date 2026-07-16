---
name: quality-improvement
description: "Execute a quality improvement cycle: one focused improvement, fix bugs, verify, commit, push, sync branches, write 10-point plan"
---

# Quality Improvement Cycle

A repeatable workflow for systematic project improvement. The user sends the same request repeatedly across sessions to incrementally improve their projects.

## Trigger

User says something equivalent to:
> "Сделай пожалуйста одно качественное улучшение, исправь ошибки, отправь в репозиторий, синхронизируй ветки, всё сохрани в main, а остальные ветки можно удалить. Também напиши себе план из 10 пунктов и иди по нему."

Translation: Make one quality improvement, fix bugs, push to repo, sync branches to main, delete other branches, write a 10-point plan and follow it.

## Workflow

### Phase 1: Read project context
1. Read the project's `MEMORY.md` to understand architecture, rules, and known issues
2. Check the existing 10-point plan (usually in `notes.md` or the checkpoint) if one exists from a prior session
3. Identify what was already completed (✅ items) and what's next

### Phase 2: Make one quality improvement
1. Pick the next item from the 10-point plan (or create one if none exists)
2. Focus on ONE improvement — quality over quantity
3. Common improvement types:
   - Fix a bug or race condition
   - Add missing TypeScript types
   - Replace hardcoded strings with i18n
   - Fix accessibility issues (aria-labels, roles, live regions)
   - Optimize performance (memo, useMemo, lazy loading)
   - Improve error handling or logging
   - Clean up dead code or unused imports
   - Add or fix tests

### Phase 3: Verify
1. Run type check: `npx tsc --noEmit` (or `bun run typecheck`)
2. Run lint: `npx eslint .` (or `bun run lint`)
3. Run tests: `npm run test:run` (or `bun run test`)
4. Run build: `bun run build` (or `npm run build`)
5. All must pass before committing

### Phase 4: Commit and push
1. `git add` the changed files
2. Commit with a descriptive message (use conventional commits: `fix:`, `feat:`, `refactor:`, etc.)
3. Push to origin: `git push origin main`
4. Push to additional remotes: `git push amvera main` (or `git push gitverse main`)

### Phase 5: Sync and clean
1. Ensure all work is on `main`
2. Delete any other local branches: `git branch -D <branch>`
3. Delete any other remote branches: `git push origin --delete <branch>`
4. Final `git status` should show clean tree, up to date with origin/main

### Phase 6: Update plan
1. Mark the completed item with ✅ in the plan
2. If all 10 items are done, write a new 10-point plan (v2, v3, etc.)
3. Write discovered knowledge to checkpoint §7

## Stopping conditions
- One improvement per cycle (don't batch multiple changes)
- All verification must pass before committing
- If verification fails, fix the issue and re-verify before committing
- If the plan is fully completed, write a new plan and continue

## Anti-patterns to avoid
- Making multiple unrelated changes in one commit
- Committing without running verification
- Skipping the plan and doing random improvements
- Leaving uncommitted work between cycles

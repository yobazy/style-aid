# Overnight run a-style, 2026-10-29

Branch `ov/a-style`, pushed to `audit-2026-10-29`. Scratch: `/data/tmp/overnight-2026-10-29/scratch/a-style`.

## Plan

1. Audit: `docs/AUDIT-2026-10-29.md`. Done.
2. Tests: Vitest unit tests for `src/lib` and the import plugin; Playwright e2e for the main flows on desktop and phone.
3. Fixes: one commit per confirmed bug, each with a test. Dependency patch/minor bumps.
4. `LATER.md` proposal.

## Decisions

- Notes file name: the brief did not name one, so this file.
- Test tools: Vitest (fits Vite) and `@playwright/test` 1.64 (its browsers were already cached on `pc`). Dev dependencies only.
- E2E runs Vite on port 5391 (free on `pc` at the time); override with `E2E_PORT`.

## Done

- Stage 1 audit committed.

## Left

- Everything from stage 2 on.

## Try it

```
npm install
npm run lint && npm run build
```

## Needs Bazil

(filled in at the end)

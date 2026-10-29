# Overnight run a-style, 2026-10-29

Branch `ov/a-style`, pushed to `audit-2026-10-29`. Scratch (screenshots): `/data/tmp/overnight-2026-10-29/scratch/a-style`.

## What the app is

A local-only wardrobe planner (React 19 + Vite 8, data in `localStorage`). Five tabs: Home, Looks, Closet, Wishlist, Insights. The only server code is the Vite dev/preview middleware `/api/import-product`.

## Plan and status

1. Audit: `docs/AUDIT-2026-10-29.md`. Done.
2. Tests: Vitest (78 unit tests) and Playwright (15 specs x desktop + phone = 30 runs). Done. There were no tests before.
3. Fixes: 14 fix commits, each with a test. Done. See the "Fixed in this run" table in the audit.
4. `LATER.md`: proposal written. Done.
5. README rewritten for the app (it was the Vite template).

## Decisions made without asking

- Notes file name: the brief did not name one, so this file.
- Test tools: Vitest and `@playwright/test` 1.64 (its Chromium was already cached on `pc`). Dev dependencies only. E2E uses port 5391; override with `E2E_PORT`.
- Wishlist merge rule (B3): when an entry with the same title and category is re-added, non-empty incoming text fields win, blanks never wipe, lists are merged, and the existing status, priority, purchased flag and replacement link are kept.
- Look builder (B7): hidden picks are kept in the draft but not counted or saved, so switching back to the old scenario restores them.
- Import SSRF (S1): blocks loopback, private, link-local, CGNAT (which covers Tailscale 100.x), multicast and reserved ranges, checks every redirect hop, 8 s timeout, 5 MB read cap. DNS rebinding is a known remaining gap (documented).
- Dependencies: everything bumped within its major and `npm audit fix` (0 vulnerabilities). React held on 19.2.9 because 19.3.1 grew the bundle from 71.6 to 80.3 kB gzip; Vite floor raised to `^8.3.5`.
- Swatch contrast (A6) counted as a bug fix, not a redesign: same layout, only the label color changes by swatch brightness.
- Not changed (design or product calls): phone tab bar, picker card size, all-caps labels, focus ring style, photo downscaling, edit/delete, bought-to-closet. All in `LATER.md`.

## Screenshots

- Before: `before-{desktop,phone}-{home,looks,closet,wishlist,insights}.png`, `before-phone-looks-viewport.png`
- After: `after-storage-full.png` (warning instead of blank page), `after-wishlist-price.png` (`$1,295` instead of `$NaN`), `after-insights.png` (best next spend ranked), `after-closet-swatch.png` (readable label on a black piece; compare `before-desktop-closet.png`)

## Try it

```
npm install
npm run lint && npm run typecheck && npm test
npx playwright install chromium   # once
npm run test:e2e
npm run dev
```

## Left

- Nothing half-built. Everything not fixed is listed in `LATER.md` and in the audit.

## Needs Bazil

1. Phone tab bar: it wraps to three sticky rows (about 30% of the screen). Change it to a single scrolling row or a bottom bar?
2. All-caps letter-spaced tabs and eyebrows go against the sentence-case rule. Switch to sentence case?
3. Photos: downscale on upload (about 800 px) so storage stops filling up? This changes stored image quality.
4. Should marking a wishlist item Bought add it to the closet? And do you want edit and delete for pieces and looks?
5. Look status: keep the manual select, or derive it from completeness?
6. React 19.3: take it now (+9 kB gzip) or wait?
7. Review draft PR "Audit, tests and fixes (2026-10-29)" on branch `audit-2026-10-29`.

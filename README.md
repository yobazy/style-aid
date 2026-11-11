# Style Aid

A wardrobe planner that builds outfits around real scenarios. Log the pieces you own, save looks for work, going out, weekends, date nights and travel, and keep a wishlist where every item is tied to the looks it would finish.

## Run it

```
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run preview` | Serve the built app |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b` |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`, `vite.plugins/**/*.test.ts`) |
| `npm run test:e2e` | Playwright end-to-end tests in `e2e/`, desktop and phone. Starts Vite on port 5391 (`E2E_PORT` to change). Run `npx playwright install chromium` once first. |

## How it works

- **Data** lives only in the browser's `localStorage` under `style-aid-state-v2` (older `style-aid-state-v1` data is migrated on load). There is no backend and no account. Photos are stored inside that same entry as data URLs, so large photos fill the browser's storage quickly; the app shows a warning when a save fails.
- **Scenarios** and their required categories are in `src/data/scenarios.ts`. A look's completeness is how many of its scenario's required slots it fills (`src/lib/looks.ts`).
- **Insights** (gaps, wishlist usefulness, spend) are computed in `src/lib/insights.ts`.
- **Product import**: "Import from link" on the Wishlist tab calls `GET /api/import-product?url=...`, a Vite middleware in `vite.plugins/productImport.ts` that reads the page's Open Graph tags. It only exists under `npm run dev` and `npm run preview`; a static deploy of `dist/` has no import endpoint. It only fetches public http(s) addresses.

## Layout

```
src/
  App.tsx              state, persistence and tab routing
  components/          one view per tab plus the radar chart
  lib/                 pure logic (looks, insights, storage, wishlist merge, colors, import client)
  data/scenarios.ts    scenario presets
vite.plugins/          product import middleware
e2e/                   Playwright specs
docs/                  audit and run notes
```

# Later (proposal)

> Proposed by the 2026-10-29 overnight audit. Nothing here is decided; keep, cut or reorder freely. Details for each item are in `docs/AUDIT-2026-10-29.md`.

## Data and storage

- **Downscale photos on upload** (for example to 800 px JPEG). Why: full-size photos in `localStorage` hit the ~5 MB quota after a few pieces and slow every save.
- **Move photos to IndexedDB** if downscaling is not enough. Why: IndexedDB has a much larger quota and keeps the main state small.
- **Export and import a backup file.** Why: all data lives in one browser; clearing site data or switching devices loses everything.
- **Validate stored state on load.** Why: a partly malformed entry (for example a piece without `tags`) crashes rendering instead of falling back.

## Core features

- **Edit and delete closet pieces and looks.** Why: today a typo or a sold piece can only be fixed by clearing storage.
- **Move a bought wishlist item into the closet.** Why: "Bought" currently just hides the spend; the piece never becomes something you can style.
- **Keep the look draft when jumping to the wishlist.** Why: tapping a missing piece in the builder throws away the look you were building.
- **Block saving a look with no pieces.** Why: empty looks add noise to coverage and gaps.
- **Decide what Look status means.** Why: it is a manual select that drifts from the computed status, and "Wishlist-Backed" only appears when two or more pieces are missing.

## Phone layout

- **Single-row or bottom tab bar on phones.** Why: the sticky bar wraps to three rows and covers about 30% of an iPhone screen.
- **Compact piece picker in the look builder.** Why: each piece card is about 390 px tall, making the Looks tab about 12,000 px long.

## Accessibility and copy

- **Focus ring on `:focus-visible` instead of `:hover`.** Why: keyboard users only get the browser default ring today.
- **Show the Formality slider value.** Why: the slider has no visible number.
- **Sentence case for tabs and eyebrow labels.** Why: all-caps, letter-spaced labels are harder to read and go against the house copy rule.
- **Visible tiles for dark pieces in look collages.** Why: black pieces render as near-black squares on a near-black card.

## Product import

- **Host the import endpoint somewhere real** (a small serverless function) if the app is ever deployed. Why: it only exists under the Vite dev and preview servers.
- **Reject non-http product links in the form.** Why: any text is accepted as a link today.

## Dependencies

- **React 19.3.** Why: held on 19.2.9 because 19.3.1 adds about 9 kB gzip (+12%) with nothing in the app needing it yet.
- **TypeScript 7 and `@types/node` 26.** Why: major upgrades, left for a deliberate pass.
- **Delete unused template assets** (`src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `public/icons.svg`). Why: they ship nothing and confuse what belongs to the app.

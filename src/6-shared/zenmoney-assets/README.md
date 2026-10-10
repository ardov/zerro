# ZenMoney-derived assets

This directory contains assets extracted from ZenMoney Android application
version. It is intentionally separate from application-owned artwork.

## Contents

- `categories/` — 167 category icons indexed by the full ZenMoney `tag.icon`
  value (for example, `3004_taxi`), plus the uncategorized fallback.
- `banks/` — 382 numbered bank icons indexed by ZenMoney bank icon ID, plus
  three `unknown bank` fallbacks indexed by native size.
- `index.ts` — runtime category mapping and uncategorized fallback.
- `bankIcons.ts` — local bank asset URLs indexed by `account.company`.

Category assets are rendered as CSS masks, so their original fill colours are
ignored and the visible colour is inherited from `currentColor`. Bank assets
retain their original colours and are rendered by the shared account
`AccountIcon` in account lists and selectors. Their 20px image has a white
backing for artwork with dark details; it does not recolour the logo. Missing
bank IDs and failed images fall back to the theme-aware account glyph.
Bank SVGs are emitted as separate files rather than inlined into application
JavaScript and included in the service worker's precache for offline use.
Lookup needs no network request to the company directory and no name matching.

## Rights and provenance

The category artwork is owned by ZenMoney. Bank logos and trademarks belong to
their respective rights holders. These files are not original Zerro artwork.
They are included with permission from ZenMoney; do not copy, redistribute, or
reuse them outside the scope of that permission.

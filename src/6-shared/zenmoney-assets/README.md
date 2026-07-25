# ZenMoney-derived assets

This directory contains assets extracted from ZenMoney Android application
version. It is intentionally separate from application-owned artwork.

## Contents

- `categories/` — 167 category icons indexed by the full ZenMoney `tag.icon`
  value (for example, `3004_taxi`), plus the uncategorized fallback.
- `banks/` — 382 numbered bank icons indexed by ZenMoney bank icon ID, plus
  three `unknown bank` fallbacks indexed by native size.
- `index.ts` — runtime category mapping and uncategorized fallback.
- `bankIcons.ts` — bank ID mapping, deliberately not imported by the app yet.

Category assets are rendered as CSS masks, so their original fill colours are
ignored and the visible colour is inherited from `currentColor`. Bank assets
are not yet used by the UI and must retain their original colours when they
are introduced.

## Rights and provenance

The category artwork is owned by ZenMoney. Bank logos and trademarks belong to
their respective rights holders. These files are not original Zerro artwork.
They are included with permission from ZenMoney; do not copy, redistribute, or
reuse them outside the scope of that permission.

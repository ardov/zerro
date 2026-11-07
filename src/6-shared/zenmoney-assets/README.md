# Zenmoney-derived assets

This directory contains Zenmoney category artwork and bank logos, kept
separate from application-owned artwork.

## Contents

- `categories/` — 167 category icons indexed by the full Zenmoney `tag.icon`
  value (for example, `3004_taxi`), plus the uncategorized fallback.
- `banks/` — 432 numbered bank icons indexed by Zenmoney bank icon ID, plus
  three `unknown bank` fallbacks indexed by native size.
- `index.ts` — runtime category mapping and uncategorized fallback.
- `bankIcons.ts` — local bank asset URLs indexed by `account.company`.
- `categoryColors.ts` — the category colour palette offered by the Zenmoney
  app.

Category assets are rendered as CSS masks, so their original fill colours are
ignored and the visible colour is inherited from `currentColor`. Bank assets
retain their original colours and are rendered by the shared account
`AccountIcon` in account lists and selectors. Their 20px image is rendered
without an added background or corner clipping. Missing bank IDs and failed
images fall back to the theme-aware account glyph.
Vite bundles the SVGs as data URLs in two separately cached JavaScript files,
one for categories and one for banks. The account icon loads the bank catalog
when an account has a company ID. The service worker precaches both bundles for
offline use.
Lookup needs no network request to the company directory and no name matching.

## Rights and provenance

The category artwork is owned by Zenmoney. Bank logos and trademarks belong to
their respective rights holders. These files are not original Zerro artwork.
They are included with permission from Zenmoney; do not copy, redistribute, or
reuse them outside the scope of that permission.

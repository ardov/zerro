# Zenmoney artwork

Category icons are keyed by the full `tag.icon` value, such as `3004_taxi`. They render as CSS masks in the current text color. Bank logos retain their colors and are looked up by `account.company`. A missing or failed bank image falls back to the account glyph.

Vite inlines SVGs as data URLs in separate bank and category bundles. The account icon loads the bank catalog for accounts with a company ID. Both bundles are precached for offline use. [Category lookup](index.ts) · [Bank lookup](bankIcons.ts)

## Rights

Zenmoney owns the category artwork. Bank logos and trademarks belong to their respective rights holders. These assets are included with permission from Zenmoney. Do not copy, redistribute or reuse them outside the scope of that permission.

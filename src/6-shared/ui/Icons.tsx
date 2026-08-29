/** Barrel for the app's icons, and the only path that imports one.
 *
 * It holds nothing of its own: the set lives in `./feather`, which is where a
 * new glyph is defined. Reaching past this file used to mean something — the
 * barrel mixed in glyphs from `@mui/icons-material` and `./feather` was the
 * MUI-free half — and now it does not, so there is one door instead of two
 * equivalent ones to pick between at every call site. */
export * from './feather'

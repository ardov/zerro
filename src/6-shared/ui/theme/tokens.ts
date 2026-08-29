import type { TPalette } from './palette'
import { elevations, palettes, radius, zIndex } from './palette'
import { alpha } from './color'

/** The CSS custom properties the whole app is styled through, and the only
 * place a palette value turns into one.
 *
 * The composed ones are composed here rather than written as an opacity
 * modifier at the call site: `hover:bg-primary/4` would fork the number that
 * `action.hoverOpacity` names, where no change to the palette could reach it.
 *
 * They are composed in TypeScript rather than in CSS, but not for want of a
 * CSS spelling: `rgb(from var(--primary) r g b / 0.04)` replaces an alpha
 * exactly the way `alpha()` does; the stats widgets use that syntax over
 * `currentColor` in the stats widgets. `color-mix` is the one that would be
 * wrong, because it multiplies.
 *
 * The reason is that a custom property is an unevaluated token stream. A token
 * written that way computes to `rgb(from #37474f r g b / 0.04)` and paints as
 * `color(srgb …)`, so it stops being a colour anything can read back — neither
 * a browser check comparing notations nor a check that the palette did not move
 * between two builds. The palette is static, so composing once at module load
 * costs nothing and leaves every token a plain `rgba()`. `getContrastText`
 * has to run in JavaScript for a tag's colour regardless, so `color.ts` is
 * there either way.
 *
 * Every name here needs a counterpart in `src/tailwind.css`, a `--color-*`
 * alias or an `@utility`, or it forces `[box-shadow:var(--elevation-8)]` at
 * the call site and quietly brings arbitrary values back. */
function paletteTokens(palette: TPalette) {
  const { action, background, common, grey, text } = palette
  const isLight = palette.mode === 'light'

  return {
    '--background': background.default,
    '--foreground': text.primary,
    '--card': background.paper,
    '--card-foreground': text.primary,
    '--popover': background.paper,
    '--popover-foreground': text.primary,

    /* The tooltip uses grey 700
       at 92 per cent, over white type. */
    '--tooltip': alpha(grey[700], 0.92),
    '--tooltip-foreground': common.white,

    '--primary': palette.primary.main,
    '--primary-foreground': palette.primary.contrastText,
    /* State fills for text buttons and selected menu items. The combined state
       is the sum of the selected and hover opacities. */
    '--primary-hover': alpha(palette.primary.main, action.hoverOpacity),
    '--primary-focus': alpha(palette.primary.main, action.focusOpacity),
    '--primary-selected': alpha(palette.primary.main, action.selectedOpacity),
    '--primary-selected-hover': alpha(
      palette.primary.main,
      action.selectedOpacity + action.hoverOpacity
    ),
    /* Disabled menu items are dimmed rather than recolored, so this is an
       opacity and not a colour like `--disabled-foreground`. */
    '--disabled-opacity': String(action.disabledOpacity),
    /* The remaining Button colors, only for the variant and color
       pairs the app actually renders. */
    '--primary-dark': palette.primary.dark,
    '--interactive-hover': alpha(palette.secondary.main, action.hoverOpacity),
    '--foreground-hover': alpha(text.primary, action.hoverOpacity),
    '--error-hover': alpha(palette.error.main, action.hoverOpacity),
    '--primary-outline': alpha(palette.primary.main, 0.5),
    '--error-outline': alpha(palette.error.main, 0.5),
    '--disabled-background': action.disabledBackground,

    '--secondary': action.selected,
    '--secondary-foreground': text.primary,
    '--muted': action.hover,
    '--muted-foreground': text.secondary,
    '--accent': action.hover,
    '--accent-foreground': text.primary,
    '--action-focus': action.focus,
    '--destructive': palette.error.main,
    '--destructive-foreground': palette.error.contrastText,
    '--border': palette.divider,
    /* The outlined field's border is heavier than the divider, so this is a
       value of its own rather than an alias of `--border`: 23% of the color
       that sits on the background. */
    '--input': alpha(isLight ? common.black : common.white, 0.23),
    '--action-active': action.active,
    /* A disabled field uses `action.disabled` for its border and
       `text.disabled` for its text. They currently hold the same value,
       so they are only distinguishable once one of them moves. */
    '--action-disabled': action.disabled,

    /* A chip's own. Its fill is `action.selected`, which `--secondary` already
       carries; these are the ones nothing else names. */
    '--chip-hover': alpha(
      action.selected,
      action.selectedOpacity + action.hoverOpacity
    ),
    '--chip-primary-border': alpha(palette.primary.main, 0.7),
    '--chip-border': isLight ? grey[400] : grey[700],
    '--chip-delete': alpha(text.primary, 0.26),
    '--chip-delete-hover': alpha(text.primary, 0.4),

    /* A link underline in a fainter shade of the link
       itself and hands back to the text colour on hover. */
    '--link-underline': alpha(palette.primary.main, 0.4),

    /* A switch built from the scheme's extremes rather than
       of the palette: the thumb is white on light and grey 300 on dark, and
       the track is the opposite colour at an opacity that also differs. */
    '--switch-thumb': isLight ? common.white : grey[300],
    '--switch-track': isLight ? common.black : common.white,
    '--switch-track-opacity': isLight ? '0.38' : '0.3',

    '--ring': palette.primary.main,
    '--interactive': palette.secondary.main,
    '--interactive-foreground': palette.secondary.contrastText,
    '--success': palette.success.main,
    '--success-foreground': palette.success.contrastText,
    '--warning': palette.warning.main,
    '--warning-foreground': palette.warning.contrastText,
    '--info': palette.info.main,
    '--info-foreground': palette.info.contrastText,
    '--error': palette.error.main,
    '--error-foreground': palette.error.contrastText,
    '--disabled-foreground': text.disabled,
  }
}

/** What does not change with the scheme. */
const staticTokens = {
  '--radius': `${radius}px`,
  ...Object.fromEntries(
    Object.entries(elevations).map(([level, shadow]) => [
      `--elevation-${level}`,
      shadow,
    ])
  ),
  '--z-modal': String(zIndex.modal),
  '--z-drawer': String(zIndex.drawer),
  '--z-tooltip': String(zIndex.tooltip),
}

const declarations = (tokens: Record<string, string>) =>
  Object.entries(tokens)
    .map(([name, value]) => `${name}: ${value};`)
    .join('')

/** Both schemes at once, so that switching between them is a class on the
 * root rather than a re-render and a new stylesheet. `:root` carries light and
 * `.dark` overrides it — the same class the Tailwind `dark` variant keys off,
 * and the same one `color-scheme` follows in `styles.scss`. */
export const themeTokensCss = [
  `:root{${declarations({ ...staticTokens, ...paletteTokens(palettes.light) })}}`,
  `:root.dark{${declarations(paletteTokens(palettes.dark))}}`,
].join('')

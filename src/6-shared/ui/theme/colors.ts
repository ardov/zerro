import { ColorScale } from '@/6-shared/helpers/color'

/** The resolved application colour scheme. The page-level theme manager owns
 * the preference; this module retains chart, warning and snackbar colours. */
export type ColorScheme = 'light' | 'dark'

type SemanticLevels = {
  BACKGROUND: number
  SURFACE: number
  SUBTLE: number
  BORDER: number
  BORDER_STRONG: number
  TEXT_DISABLED: number
  TEXT_MUTED: number
  TEXT: number
  ON_SOLID: number
  SOLID: number
  SOLID_HOVER: number
}

/** A few representative stops preserve the character of the shipped theme;
 * ColorScale supplies the continuous lightness coordinate and black/white
 * anchors between and beyond them. */
const concreteScales = {
  neutral: new ColorScale([
    '#121212',
    '#212121',
    '#616161',
    '#bdbdbd',
    '#e0e0e0',
    '#f5f5f5',
  ]),
  blueGrey: new ColorScale(['oklch(0.4 0.015 230)', 'oklch(0.8 0.013 230)']),
  blue: new ColorScale([
    'oklch(0.26 0.08 264)',
    'oklch(0.56 0.16 254)',
    'oklch(0.71 0.14 248)',
    'oklch(0.93 0.03 230)',
  ]),
  green: new ColorScale(['oklch(0.82 0.32 145)']),
  orange: new ColorScale([
    '#e65100',
    '#ed6c02',
    '#f57c00',
    '#ffa726',
    '#ffb74d',
  ]),
  red: new ColorScale(['#c62828', '#d32f2f', '#f44336', '#ef5350', '#e57373']),
}

/** UI meaning stays independent from the present hue assignment. */
const semanticScales = {
  neutral: concreteScales.neutral,
  primary: concreteScales.blueGrey,
  interactive: concreteScales.blue,
  success: concreteScales.green,
  warning: concreteScales.orange,
  info: concreteScales.blue,
  error: concreteScales.red,
}

/** Measured from the effective pre-migration theme. Transparent roles are
 * measured after compositing over white (light) or black (dark), matching the
 * reference surfaces used by ColorScale's transparent renderings. */
const LEVELS: Record<ColorScheme, SemanticLevels> = {
  light: {
    BACKGROUND: 0.97,
    SURFACE: 1,
    SUBTLE: 0.97,
    BORDER: 0.907,
    BORDER_STRONG: 0.808,
    TEXT_DISABLED: 0.683,
    TEXT_MUTED: 0.51,
    TEXT: 0.248,
    ON_SOLID: 1,
    SOLID: 0.568,
    SOLID_HOVER: 0.539,
  },
  dark: {
    BACKGROUND: 0.182,
    SURFACE: 0.248,
    SUBTLE: 0.145,
    BORDER: 0.235,
    BORDER_STRONG: 0.352,
    TEXT_DISABLED: 0.493,
    TEXT_MUTED: 0.77,
    TEXT: 1,
    ON_SOLID: 0.248,
    SOLID: 0.734,
    SOLID_HOVER: 0.672,
  },
}

/** One flat factory evaluates each token formula against the selected scheme.
 * Local arithmetic is the intentional escape hatch for optical corrections:
 * the exception stays visible beside the role it corrects. */
function createColorTokens(mode: ColorScheme) {
  const isLight = mode === 'light'
  const {
    BACKGROUND,
    SURFACE,
    SUBTLE,
    BORDER,
    TEXT_DISABLED,
    TEXT_MUTED,
    TEXT,
    ON_SOLID,
    SOLID,
    SOLID_HOVER,
  } = LEVELS[mode]

  const transparentAt = (scale: ColorScale, level: number) =>
    isLight ? scale.opaqueAt(level) : scale.opaqueInvAt(level)
  const onSolid = () =>
    isLight
      ? semanticScales.neutral.at(ON_SOLID)
      : semanticScales.neutral.opaqueAt(ON_SOLID)

  const primarySolidLevel = SOLID + (isLight ? -0.181 : 0.143)
  const interactiveSolidLevel = SOLID + (isLight ? -0.003 : 0.082)
  const successSolidLevel = SOLID + (isLight ? -0.045 : 0.076)
  const warningSolidLevel = SOLID + (isLight ? 0.109 : 0.063)
  const infoSolidLevel = SOLID + (isLight ? 0.035 : 0)
  const errorSolidLevel = SOLID + (isLight ? 0 : -0.091)

  /* The one surface a transparent rendering is wrong for: reading the page
     through a tooltip is the thing a tooltip exists to prevent. It is also
     the same dark chip in both schemes rather than a role sampled twice, so
     the level is written out instead of derived from one. */
  const tooltipLevel = 0.5

  const primary = semanticScales.primary.at(primarySolidLevel)
  const error = semanticScales.error.at(errorSolidLevel)
  const foreground = semanticScales.neutral.at(TEXT)
  const surface = semanticScales.neutral.at(SURFACE)

  return {
    '--background': semanticScales.neutral.at(BACKGROUND),
    '--foreground': foreground,
    '--card': surface,
    '--card-foreground': foreground,
    '--tooltip': semanticScales.neutral.at(tooltipLevel),
    '--tooltip-foreground': semanticScales.neutral.at(1),

    '--primary': primary,
    '--interactive': semanticScales.interactive.at(interactiveSolidLevel),
    '--muted-foreground': transparentAt(semanticScales.neutral, TEXT_MUTED),
    '--border': transparentAt(semanticScales.neutral, BORDER),
    '--disabled-foreground': transparentAt(
      semanticScales.neutral,
      TEXT_DISABLED
    ),

    '--success': semanticScales.success.at(successSolidLevel),
    '--warning': semanticScales.warning.at(warningSolidLevel),
    '--warning-foreground': onSolid(),
    '--warning-surface': transparentAt(semanticScales.warning, SUBTLE),
    '--warning-border': transparentAt(semanticScales.warning, BORDER),
    '--info': semanticScales.info.at(infoSolidLevel),
    '--info-foreground': onSolid(),
    '--error': error,
    '--error-foreground': semanticScales.neutral.at(1),
    '--error-surface': transparentAt(semanticScales.error, SUBTLE),
    '--error-border': transparentAt(semanticScales.error, BORDER),
    '--data-primary': semanticScales.primary.at(
      SOLID_HOVER + (isLight ? -0.233 : 0)
    ),
    '--data-primary-alt': semanticScales.primary.at(
      SOLID + (isLight ? -0.048 : 0.165)
    ),
    '--data-success': semanticScales.success.at(
      SOLID + (isLight ? 0.05 : 0.097)
    ),
    '--data-error': semanticScales.error.at(SOLID + (isLight ? 0.086 : -0.046)),
    '--data-error-alt': semanticScales.error.at(
      SOLID + (isLight ? -0.029 : -0.166)
    ),
  }
}

const colorTokens = {
  light: createColorTokens('light'),
  dark: createColorTokens('dark'),
}

const declarations = (tokens: Record<string, string>) =>
  Object.entries(tokens)
    .map(([name, value]) => `${name}: ${value};`)
    .join('')

/** Both schemes at once, so switching is a root class change rather than a
 * React render and a replacement stylesheet. */
export const themeTokensCss = [
  `:root{${declarations(colorTokens.light)}}`,
  `:root.dark{${declarations(colorTokens.dark)}}`,
].join('')

const SHOWCASE_LEVELS = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1]

/** Read-only samples for the Storybook showcase. Scale objects and authoring
 * levels remain private to this module. */
export const getThemeColorShowcase = (mode: ColorScheme) => ({
  concreteScales: Object.entries(concreteScales).map(([name, scale]) => ({
    name,
    colors: SHOWCASE_LEVELS.map(level => scale.at(level)),
  })),
  semanticScales: Object.entries(semanticScales).map(([name, scale]) => ({
    name,
    colors: SHOWCASE_LEVELS.map(level => scale.at(level)),
  })),
  levels: Object.entries(LEVELS[mode]).map(([name, level]) => ({
    name,
    level,
    color: semanticScales.neutral.at(level),
  })),
})

import { ColorScale } from '6-shared/helpers/color'

/** The resolved application colour scheme. The page-level theme manager owns
 * the preference; this module owns every colour the resolved scheme emits. */
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
  blueGrey: new ColorScale([
    'rgb(38, 49, 55)',
    '#37474f',
    'rgb(95, 107, 114)',
    'rgb(144, 151, 154)',
    '#cfd8dc',
    'rgb(216, 223, 227)',
  ]),
  blue: new ColorScale([
    'rgb(17, 82, 147)',
    '#1976d2',
    'rgb(71, 145, 219)',
    '#90caf9',
    'rgb(166, 212, 250)',
  ]),
  green: new ColorScale([
    'rgb(32, 87, 35)',
    '#2e7d32',
    'rgb(87, 151, 91)',
    '#00e676',
    'rgb(51, 235, 145)',
  ]),
  orange: new ColorScale([
    '#e65100',
    '#ed6c02',
    '#f57c00',
    '#ffa726',
    '#ffb74d',
  ]),
  lightBlue: new ColorScale([
    '#01579b',
    '#0288d1',
    '#29b6f6',
    '#03a9f4',
    '#4fc3f7',
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
  info: concreteScales.lightBlue,
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
    BORDER_STRONG,
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

  const selectedLevel = isLight ? SUBTLE - 0.037 : SURFACE + 0.03
  const selectedHoverLevel = isLight ? BORDER : BORDER_STRONG - 0.03

  /* The one surface a transparent rendering is wrong for: reading the page
     through a tooltip is the thing a tooltip exists to prevent. It is also
     the same dark chip in both schemes rather than a role sampled twice, so
     the level is written out instead of derived from one. */
  const tooltipLevel = 0.5

  const primary = semanticScales.primary.at(primarySolidLevel)
  const error = semanticScales.error.at(errorSolidLevel)
  const foreground = semanticScales.neutral.at(TEXT)
  const surface = semanticScales.neutral.at(SURFACE)
  const subtle = transparentAt(semanticScales.neutral, SUBTLE)
  const selected = transparentAt(semanticScales.neutral, selectedLevel)

  return {
    '--background': semanticScales.neutral.at(BACKGROUND),
    '--foreground': foreground,
    '--card': surface,
    '--card-foreground': foreground,
    '--popover': surface,
    '--popover-foreground': foreground,

    '--tooltip': semanticScales.neutral.at(tooltipLevel),
    '--tooltip-foreground': semanticScales.neutral.at(1),

    '--primary': primary,
    '--primary-foreground': onSolid(),
    '--primary-hover': transparentAt(semanticScales.primary, SUBTLE),
    '--primary-surface': transparentAt(semanticScales.primary, SUBTLE),
    '--primary-focus': transparentAt(semanticScales.primary, BORDER),
    '--primary-selected': transparentAt(semanticScales.primary, selectedLevel),
    '--primary-selected-hover': transparentAt(
      semanticScales.primary,
      selectedHoverLevel
    ),
    '--primary-solid-hover': semanticScales.primary.at(
      SOLID_HOVER + (isLight ? -0.233 : 0)
    ),
    '--primary-border': transparentAt(semanticScales.primary, BORDER),
    '--disabled-opacity': '0.38',

    '--interactive': semanticScales.interactive.at(interactiveSolidLevel),
    '--interactive-foreground': onSolid(),
    '--interactive-hover': transparentAt(semanticScales.interactive, SUBTLE),
    '--interactive-surface': transparentAt(semanticScales.interactive, SUBTLE),
    '--interactive-border': transparentAt(semanticScales.interactive, BORDER),
    '--foreground-hover': transparentAt(semanticScales.neutral, SUBTLE),

    '--selected': selected,
    '--selected-foreground': foreground,
    '--muted': subtle,
    '--muted-foreground': transparentAt(semanticScales.neutral, TEXT_MUTED),
    '--accent': subtle,
    '--accent-foreground': foreground,
    '--focus-surface': transparentAt(semanticScales.neutral, BORDER),
    '--border': transparentAt(semanticScales.neutral, BORDER),
    '--border-strong': transparentAt(semanticScales.neutral, BORDER_STRONG),
    '--icon-foreground': isLight
      ? transparentAt(semanticScales.neutral, TEXT_MUTED + 0.05)
      : semanticScales.neutral.at(TEXT),
    '--disabled-control-foreground': transparentAt(
      semanticScales.neutral,
      TEXT_DISABLED + (isLight ? 0.115 : -0.07)
    ),
    '--disabled-border': transparentAt(
      semanticScales.neutral,
      TEXT_DISABLED + (isLight ? 0.115 : -0.07)
    ),
    '--disabled-background': transparentAt(semanticScales.neutral, BORDER),
    '--disabled-foreground': transparentAt(
      semanticScales.neutral,
      TEXT_DISABLED
    ),

    '--success': semanticScales.success.at(successSolidLevel),
    '--success-foreground': onSolid(),
    '--success-surface': transparentAt(semanticScales.success, SUBTLE),
    '--success-border': transparentAt(semanticScales.success, BORDER),
    '--warning': semanticScales.warning.at(warningSolidLevel),
    '--warning-foreground': onSolid(),
    '--warning-surface': transparentAt(semanticScales.warning, SUBTLE),
    '--warning-border': transparentAt(semanticScales.warning, BORDER),
    '--info': semanticScales.info.at(infoSolidLevel),
    '--info-foreground': onSolid(),
    '--info-surface': transparentAt(semanticScales.info, SUBTLE),
    '--info-border': transparentAt(semanticScales.info, BORDER),
    '--error': error,
    '--error-foreground': semanticScales.neutral.at(1),
    '--error-hover': transparentAt(semanticScales.error, SUBTLE),
    '--error-surface': transparentAt(semanticScales.error, SUBTLE),
    '--error-border': transparentAt(semanticScales.error, BORDER),
    /* Kept for shadcn-compatible consumers without a second authored error. */
    '--destructive': error,
    '--destructive-foreground': semanticScales.neutral.at(1),

    /* Data series stay independent from controls even where they currently
       sample the same point, so later chart calibration remains local. */
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

    /* Component-local roles whose relationships are not shared elsewhere. */
    '--chip-hover': transparentAt(
      semanticScales.neutral,
      isLight ? BORDER : BORDER_STRONG - 0.03
    ),
    '--chip-primary-border': transparentAt(
      semanticScales.primary,
      SOLID + (isLight ? 0.04 : -0.03)
    ),
    '--chip-border': semanticScales.neutral.at(
      TEXT_DISABLED + (isLight ? 0.115 : 0)
    ),
    '--chip-delete': transparentAt(
      semanticScales.neutral,
      TEXT_DISABLED + (isLight ? 0.115 : -0.1)
    ),
    '--chip-delete-hover': transparentAt(
      semanticScales.neutral,
      TEXT_DISABLED + (isLight ? -0.04 : 0.05)
    ),
    '--link-underline': transparentAt(
      semanticScales.primary,
      isLight ? BORDER_STRONG : TEXT_DISABLED
    ),
    '--switch-thumb': semanticScales.neutral.at(isLight ? SURFACE : BORDER),
    '--switch-track': semanticScales.neutral.at(isLight ? 0 : TEXT),
    '--switch-track-opacity': isLight ? '0.38' : '0.3',
    '--ring': primary,
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

/** The browser theme colour is a DOM attribute, so it is read from the same
 * generated decision as `--card` rather than back out of computed styles. */
export const getThemeColor = (mode: ColorScheme) => colorTokens[mode]['--card']

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

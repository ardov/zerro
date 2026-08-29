/** The app's palette, written out.
 *
 * It used to be four overrides handed to legacy UI's `createTheme`, which filled in
 * everything else and derived each colour's `light`, `dark` and `contrastText`
 * at runtime. These are those results, read off the resolved theme rather than
 * recomputed here: the derivations were legacy UI's, they ran once per colour, and
 * keeping the machinery would have meant keeping legacy UI to run it.
 *
 * The four the app actually chose are marked. Everything else is a Material
 * default, and none of it is load-bearing beyond looking the way it did. */

export type TColorScheme = 'light' | 'dark'

type TPaletteColor = {
  main: string
  light: string
  dark: string
  /** White or near-black, whichever reads on `main`. */
  contrastText: string
}

export type TPalette = {
  mode: TColorScheme
  primary: TPaletteColor
  secondary: TPaletteColor
  success: TPaletteColor
  error: TPaletteColor
  warning: TPaletteColor
  info: TPaletteColor
  text: { primary: string; secondary: string; disabled: string }
  background: { paper: string; default: string }
  divider: string
  action: {
    active: string
    hover: string
    hoverOpacity: number
    selected: string
    selectedOpacity: number
    disabled: string
    disabledBackground: string
    disabledOpacity: number
    focus: string
    focusOpacity: number
  }
  common: { black: string; white: string }
  /** Only the three shades anything reads: the tooltip's fill and a chip's
   * border on either scheme. */
  grey: { 300: string; 400: string; 700: string }
}

const light: TPalette = {
  mode: 'light',
  // Chosen: blueGrey 800.
  primary: {
    main: '#37474f',
    light: 'rgb(95, 107, 114)',
    dark: 'rgb(38, 49, 55)',
    contrastText: '#fff',
  },
  // Chosen: blue 700.
  secondary: {
    main: '#1976d2',
    light: 'rgb(71, 145, 219)',
    dark: 'rgb(17, 82, 147)',
    contrastText: '#fff',
  },
  // Chosen: green 800.
  success: {
    main: '#2e7d32',
    light: 'rgb(87, 151, 91)',
    dark: 'rgb(32, 87, 35)',
    contrastText: '#fff',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#fff',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#fff',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
    contrastText: '#fff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  // Chosen: white paper on grey 100.
  background: { paper: '#ffffff', default: '#f5f5f5' },
  divider: 'rgba(0, 0, 0, 0.12)',
  action: {
    active: 'rgba(0, 0, 0, 0.54)',
    hover: 'rgba(0, 0, 0, 0.04)',
    hoverOpacity: 0.04,
    selected: 'rgba(0, 0, 0, 0.08)',
    selectedOpacity: 0.08,
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
    disabledOpacity: 0.38,
    focus: 'rgba(0, 0, 0, 0.12)',
    focusOpacity: 0.12,
  },
  common: { black: '#000', white: '#fff' },
  grey: { 300: '#e0e0e0', 400: '#bdbdbd', 700: '#616161' },
}

const dark: TPalette = {
  mode: 'dark',
  // Chosen: blueGrey 100.
  primary: {
    main: '#cfd8dc',
    light: 'rgb(216, 223, 227)',
    dark: 'rgb(144, 151, 154)',
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  // Chosen: blue 200.
  secondary: {
    main: '#90caf9',
    light: 'rgb(166, 212, 250)',
    dark: 'rgb(100, 141, 174)',
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  // Chosen: green A400.
  success: {
    main: '#00e676',
    light: 'rgb(51, 235, 145)',
    dark: 'rgb(0, 161, 82)',
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
    contrastText: '#fff',
  },
  warning: {
    main: '#ffa726',
    light: '#ffb74d',
    dark: '#f57c00',
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  info: {
    main: '#29b6f6',
    light: '#4fc3f7',
    dark: '#0288d1',
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  text: {
    primary: '#fff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.38)',
  },
  // Chosen.
  background: { paper: '#212121', default: '#121212' },
  divider: 'rgba(255, 255, 255, 0.12)',
  action: {
    active: '#fff',
    hover: 'rgba(255, 255, 255, 0.04)',
    hoverOpacity: 0.04,
    selected: 'rgba(255, 255, 255, 0.16)',
    selectedOpacity: 0.16,
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
    disabledOpacity: 0.38,
    focus: 'rgba(255, 255, 255, 0.12)',
    focusOpacity: 0.12,
  },
  common: { black: '#000', white: '#fff' },
  grey: { 300: '#e0e0e0', 400: '#bdbdbd', 700: '#616161' },
}

export const palettes: Record<TColorScheme, TPalette> = { light, dark }

/** `shape.borderRadius`, in pixels. */
export const radius = 8

/** Material's elevation ladder, at the eight levels this app raises a surface
 * to. They are scheme-independent: legacy UI draws the same shadow on either. */
export const elevations: Record<number, string> = {
  1: '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
  2: '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
  4: '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
  6: '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
  8: '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
  10: '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
  16: '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
  24: '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
}

/** legacy UI's stacking levels, for the three kinds of surface this app layers. */
export const zIndex = { drawer: 1200, modal: 1300, tooltip: 1500 }

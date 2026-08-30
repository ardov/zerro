/** The complete light and dark application palettes. Values are explicit so
 * token generation is deterministic and does not require runtime derivation. */

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

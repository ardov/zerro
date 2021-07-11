import {
  createTheme as createMuiTheme,
  adaptV4Theme,
} from '@material-ui/core/styles'
import { blueGrey, blue, green, grey } from '@material-ui/core/colors'

const primary = { dark: blueGrey[100], light: blueGrey[800] }
const secondary = { dark: blue[200], light: blue[700] }
const success = { dark: green['A400'], light: green[800] }
const background = {
  dark: { paper: '#212121', default: '#121212' },
  light: { paper: '#ffffff', default: grey[100] },
}
const hoverOpacity = 0.04
const hover = {
  dark: `rgba(255, 255, 255, ${hoverOpacity})`,
  light: `rgba(0, 0, 0, ${hoverOpacity})`,
}

export function createTheme(mode: 'light' | 'dark' = 'light') {
  const theme = createMuiTheme(
    adaptV4Theme({
      palette: {
        primary: { main: primary[mode] },
        secondary: { main: secondary[mode] },
        success: { main: success[mode] },
        action: {
          hover: hover[mode],
          hoverOpacity,
        },
        mode,
        background: background[mode],
      },
      shape: { borderRadius: 8 },
      typography: {
        fontFamily: "'IBM Plex Sans', sans-serif",
        h4: { fontWeight: 500 },
        subtitle1: { fontWeight: 500 },
        subtitle2: { fontWeight: 500 },
        button: { textTransform: 'none' },
      },
    })
  )
  return theme
}

const theme = createTheme()

declare global {
  type DefaultTheme = typeof theme
}

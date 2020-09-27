import { createMuiTheme } from '@material-ui/core/styles'
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

export function createTheme(type: 'light' | 'dark' = 'light') {
  const theme = createMuiTheme({
    palette: {
      primary: { main: primary[type] },
      secondary: { main: secondary[type] },
      success: { main: success[type] },
      action: {
        hover: hover[type],
        hoverOpacity,
      },
      type,
      background: background[type],
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      button: { textTransform: 'none' },
    },
  })
  return theme
}

import { createMuiTheme } from '@material-ui/core/styles'

const primary = { dark: '#cfd8dc', light: '#455a64' }
const secondary = { dark: '#ff5722', light: '#ff5722' }
const success = { dark: '#45d980', light: '#21a355' }
const hoverOpacity = 0.04
const hover = {
  dark: `rgba(255, 255, 255, ${hoverOpacity})`,
  light: `rgba(0, 0, 0, ${hoverOpacity})`,
}

export default function createTheme(type = 'light') {
  return createMuiTheme({
    palette: {
      primary: { main: primary[type] },
      secondary: { main: secondary[type] },
      success: { main: success[type] },
      action: {
        hover: hover[type],
        hoverOpacity,
      },
      type,
    },
    shape: { borderRadius: 8 },
    typography: { fontFamily: "'IBM Plex Sans', sans-serif" },
  })
}

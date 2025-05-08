import { experimental_extendTheme as extendTheme } from '@mui/material/styles'
import { blueGrey, blue, green, grey } from '@mui/material/colors'

const hoverOpacity = 0.04

export const mainColors = {
  lightBackgroundPaper: '#ffffff',
  lightBackgroundDefault: grey[100],
  darkBackgroundPaper: '#212121',
  darkBackgroundDefault: '#121212',
}

export const appTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: blueGrey[800] },
        secondary: { main: blue[700] },
        success: { main: green[800] },
        action: {
          hover: `rgba(0, 0, 0, ${hoverOpacity})`,
          hoverOpacity,
        },
        // @ts-ignore
        text: { hint: `rgba(0, 0, 0, 0.38)` },
        background: {
          paper: mainColors.lightBackgroundPaper,
          default: mainColors.lightBackgroundDefault,
        },
      },
    },
    dark: {
      palette: {
        primary: { main: blueGrey[100] },
        secondary: { main: blue[200] },
        success: { main: green['A400'] },
        action: {
          hover: `rgba(255, 255, 255, ${hoverOpacity})`,
          hoverOpacity,
        },
        // @ts-ignore
        text: { hint: `rgba(255, 255, 255, 0.38)` },
        background: {
          paper: mainColors.darkBackgroundPaper,
          default: mainColors.darkBackgroundDefault,
        },
      },
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "'IBM Plex Sans', sans-serif",
    h4: { fontWeight: 500 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    button: { textTransform: 'none' },
  },
  components: {
    MuiPaper: {
      // Disable elevation brightness change
      styleOverrides: { root: { backgroundImage: 'unset' } },
    },
  },
})

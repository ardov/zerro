import { createTheme } from '@mui/material/styles'
import { blueGrey, blue, green, grey } from '@mui/material/colors'
import { breakpoints } from './breakpoints'

/** The MUI theme this app used to be built on, retained as the parity stories'
 * reference implementation.
 *
 * Nothing in the application reads it: the palette it resolved to is written
 * out in `palette.ts` and reaches the page as the tokens in `tokens.ts`. An
 * unthemed MUI component renders Roboto on a 4px radius, which would make
 * every comparison fail for a reason that has nothing to do with the component
 * under test. It is mounted in `.storybook/StoryProviders.tsx` and nowhere
 * else. */

const hoverOpacity = 0.04

export const storyTheme = createTheme({
  breakpoints: { values: { ...breakpoints } },
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
        text: { disabled: `rgba(0, 0, 0, 0.38)` },
        background: { paper: '#ffffff', default: grey[100] },
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
        text: { disabled: `rgba(255, 255, 255, 0.38)` },
        background: { paper: '#212121', default: '#121212' },
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
      styleOverrides: { root: { backgroundImage: 'unset' } },
    },
  },
})

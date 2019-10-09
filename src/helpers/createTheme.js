import { createMuiTheme } from '@material-ui/core/styles'

const PRIMARY = isDark => (isDark ? '#fff' : '#212121')
const SECONDARY = isDark => '#05f'
const SUCCESS = isDark => '#21a355'

export default function createTheme(type = 'light') {
  const isDark = type === 'dark'

  const donorTheme = createMuiTheme({
    palette: { primary: { main: SUCCESS(isDark) } },
  })

  return createMuiTheme({
    palette: {
      primary: { main: PRIMARY(isDark) },
      secondary: { main: SECONDARY(isDark) },
      success: donorTheme.palette.primary,
      action: {
        hover: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
        hoverOpacity: 0.04,
      },
      type,
    },

    shape: { borderRadius: 6 },

    typography: { fontFamily: "'IBM Plex Sans', sans-serif" },
  })
}

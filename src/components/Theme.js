import React from 'react'
import { connect } from 'react-redux'
import { ThemeProvider } from '@material-ui/styles'
import { createMuiTheme } from '@material-ui/core/styles'
import { getTheme } from 'store/theme'

const PRIMARY = isDark => (isDark ? '#fff' : '#212121')
const SECONDARY = isDark => '#a5f'
const SUCCESS = isDark => '#21a355'
const FONT = "'IBM Plex Sans', sans-serif"
const RADIUS = 6

const Theme = ({ children, type }) => {
  const isDark = type === 'dark'

  const donorTheme = createMuiTheme({
    palette: { primary: { main: SUCCESS(isDark) } },
  })

  const theme = createMuiTheme({
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
    shape: { borderRadius: RADIUS },
    typography: { fontFamily: FONT },
  })
  console.log('THEME', theme)

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

export default connect(
  state => ({ type: getTheme(state) }),
  null
)(Theme)

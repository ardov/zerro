import React from 'react'
import { connect } from 'react-redux'
import { ThemeProvider } from '@material-ui/styles'
import { createMuiTheme } from '@material-ui/core/styles'
import { getTheme } from 'store/theme'

const PRIMARY = '#212121'
const SECONDARY = '#fff'
const SUCCESS = '#21a355'
const FONT = "'IBM Plex Sans', sans-serif"
const RADIUS = 6

const Theme = ({ children, type }) => {
  const donorTheme = createMuiTheme({
    palette: { primary: { main: SUCCESS } },
  })

  const theme = createMuiTheme({
    palette: {
      primary: { main: PRIMARY },
      secondary: { main: SECONDARY },
      success: donorTheme.palette.primary,
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

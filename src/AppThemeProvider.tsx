import React, { FC } from 'react'
import CssBaseline from '@material-ui/core/CssBaseline'
import { ThemeProvider } from '@material-ui/styles'
import { createTheme } from 'helpers/createTheme'
import { useThemeType } from 'helpers/useThemeType'
import { Helmet } from 'react-helmet'

export const AppThemeProvider: FC = props => {
  const themeType = useThemeType()
  const theme = createTheme(themeType.type)

  return (
    <ThemeProvider theme={theme}>
      <>
        <Helmet>
          <meta name="theme-color" content={theme.palette.background.paper} />
        </Helmet>
        <CssBaseline />
        {props.children}
      </>
    </ThemeProvider>
  )
}

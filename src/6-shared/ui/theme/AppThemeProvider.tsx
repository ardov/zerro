import React, { FC } from 'react'
import { Helmet } from 'react-helmet'
import { Global, css } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, Theme } from '@mui/material/styles'
import { appTheme } from './createTheme'
import { THEME_KEY, fixOldTheme, useAppTheme, useColorScheme } from './hooks'

import './styles.scss'

fixOldTheme()

const GlobalVaribles = (props: { theme: Theme }) => {
  const styles = css`
    :root {
      --c-bg: ${props.theme.palette.background.default};
      --c-scrollbar: ${props.theme.palette.divider};
      --c-primary: ${props.theme.palette.primary.main};
    }
  `
  return <Global styles={styles} />
}

export const AppThemeProvider: FC<{ children?: React.ReactNode }> = props => {
  const { mode } = useColorScheme()

  return (
    <ThemeProvider theme={appTheme} defaultMode={mode}>
      <WithTheme />
      {props.children}
    </ThemeProvider>
  )
}

const WithTheme: FC = () => {
  const theme = useAppTheme()
  return (
    <>
      <Helmet>
        <meta name="theme-color" content={theme.palette.background.paper} />
      </Helmet>
      <CssBaseline enableColorScheme />
      <GlobalVaribles theme={theme} />
    </>
  )
}

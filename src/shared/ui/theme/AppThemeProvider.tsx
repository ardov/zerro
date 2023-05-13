import React, { FC } from 'react'
import { Helmet } from 'react-helmet'
import { Global, css } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  Theme,
} from '@mui/material/styles'
import { appTheme } from './createTheme'
import { THEME_KEY, useAppTheme } from './hooks'

import './styles.scss'

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
  return (
    <CssVarsProvider
      theme={appTheme}
      defaultMode="system"
      modeStorageKey={THEME_KEY}
    >
      <WithTheme />
      {props.children}
    </CssVarsProvider>
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

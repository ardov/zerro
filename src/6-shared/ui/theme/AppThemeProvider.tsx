import type { FC } from 'react'
import React from 'react'
import { useLayoutEffect } from 'react'
import { Global, css } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import type { Theme } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material/styles'
import type { ThemeProviderProps } from '@mui/material/styles'
import { appTheme } from './createTheme'
import { fixOldTheme, useAppTheme, useColorScheme } from './hooks'

import './styles.scss'

fixOldTheme()

const GlobalVariables = (props: { theme: Theme }) => {
  const { palette, shape, shadows } = props.theme
  const styles = css`
    :root {
      --c-bg: ${palette.background.default};
      --c-scrollbar: ${palette.divider};
      --c-primary: ${palette.primary.main};

      --background: ${palette.background.default};
      --foreground: ${palette.text.primary};
      --card: ${palette.background.paper};
      --card-foreground: ${palette.text.primary};
      --popover: ${palette.background.paper};
      --popover-foreground: ${palette.text.primary};
      --primary: ${palette.primary.main};
      --primary-foreground: ${palette.getContrastText(palette.primary.main)};
      --secondary: ${palette.action.selected};
      --secondary-foreground: ${palette.text.primary};
      --muted: ${palette.action.hover};
      --muted-foreground: ${palette.text.secondary};
      --accent: ${palette.action.hover};
      --accent-foreground: ${palette.text.primary};
      --action-focus: ${palette.action.focus};
      --destructive: ${palette.error.main};
      --destructive-foreground: ${palette.getContrastText(palette.error.main)};
      --border: ${palette.divider};
      --input: ${palette.divider};
      --ring: ${palette.primary.main};
      --interactive: ${palette.secondary.main};
      --interactive-foreground: ${palette.getContrastText(
        palette.secondary.main
      )};
      --success: ${palette.success.main};
      --success-foreground: ${palette.getContrastText(palette.success.main)};
      --warning: ${palette.warning.main};
      --warning-foreground: ${palette.getContrastText(palette.warning.main)};
      --info: ${palette.info.main};
      --info-foreground: ${palette.getContrastText(palette.info.main)};
      --error: ${palette.error.main};
      --error-foreground: ${palette.getContrastText(palette.error.main)};
      --disabled-foreground: ${palette.text.disabled};
      --radius: ${shape.borderRadius}px;
      --elevation-2: ${shadows[2]};
      --elevation-4: ${shadows[4]};
    }
  `
  return <Global styles={styles} />
}

export type AppThemeProviderProps = Pick<
  ThemeProviderProps,
  'defaultMode' | 'storageManager'
> & {
  children?: React.ReactNode
}

export const AppThemeProvider: FC<AppThemeProviderProps> = props => {
  const { mode } = useColorScheme()

  return (
    <ThemeProvider
      theme={appTheme}
      defaultMode={props.defaultMode ?? mode}
      storageManager={props.storageManager}
    >
      <WithTheme />
      {props.children}
    </ThemeProvider>
  )
}

const WithTheme: FC = () => {
  const theme = useAppTheme()

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme.palette.mode === 'dark')

    return () => root.classList.remove('dark')
  }, [theme.palette.mode])

  return (
    <>
      <meta name="theme-color" content={theme.palette.background.paper} />
      <CssBaseline enableColorScheme />
      <GlobalVariables theme={theme} />
    </>
  )
}

import type { FC } from 'react'
import React from 'react'
import { useLayoutEffect } from 'react'
import { Global, css } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import type { Theme } from '@mui/material/styles'
import { ThemeProvider, alpha } from '@mui/material/styles'
import type { ThemeProviderProps } from '@mui/material/styles'
import { appTheme } from './createTheme'
import { fixOldTheme, useAppTheme, useColorScheme } from './hooks'

import './styles.scss'

fixOldTheme()

const GlobalVariables = (props: { theme: Theme }) => {
  const { palette, shape, shadows, zIndex } = props.theme
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
      /* The state fills MUI paints a text button and a selected menu item
         with. The theme already names these opacities — createTheme even
         pins hoverOpacity itself — so they are composed here rather than
         written out as \`bg-primary/4\` at each call site, where a change to
         the theme would not reach them. Selected-and-hovered is the sum of
         the two, the way MUI stacks them. */
      --primary-hover: ${alpha(
        palette.primary.main,
        palette.action.hoverOpacity
      )};
      --primary-focus: ${alpha(
        palette.primary.main,
        palette.action.focusOpacity
      )};
      --primary-selected: ${alpha(
        palette.primary.main,
        palette.action.selectedOpacity
      )};
      --primary-selected-hover: ${alpha(
        palette.primary.main,
        palette.action.selectedOpacity + palette.action.hoverOpacity
      )};
      /* MUI dims a disabled menu item rather than recolouring it, so this is
         an opacity and not a colour like --disabled-foreground. */
      --disabled-opacity: ${palette.action.disabledOpacity};
      /* The rest of what MUI's Button needs, and only for the variant and
         colour pairs the app actually renders: text in primary, secondary and
         inherit, contained in primary, outlined in error. */
      --primary-dark: ${palette.primary.dark};
      --interactive-hover: ${alpha(
        palette.secondary.main,
        palette.action.hoverOpacity
      )};
      --foreground-hover: ${alpha(
        palette.text.primary,
        palette.action.hoverOpacity
      )};
      --error-hover: ${alpha(palette.error.main, palette.action.hoverOpacity)};
      --primary-outline: ${alpha(palette.primary.main, 0.5)};
      --error-outline: ${alpha(palette.error.main, 0.5)};
      --disabled-background: ${palette.action.disabledBackground};
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
      /* The outlined field border is heavier than the divider, so --input is
         a value of its own rather than an alias of --border. MUI's own
         OutlinedInput builds it as 23% of the colour that sits on the
         background, so build it the same way instead of pasting the two
         literals that expression happens to produce today. */
      --input: ${alpha(
        palette.mode === 'light' ? palette.common.black : palette.common.white,
        0.23
      )};
      --action-active: ${palette.action.active};
      /* MUI disables a field's border with action.disabled and greys its text
         with text.disabled. They hold the same value in the default palette,
         so they are only distinguishable once one of them moves. */
      --action-disabled: ${palette.action.disabled};
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
      --elevation-1: ${shadows[1]};
      --elevation-2: ${shadows[2]};
      --elevation-4: ${shadows[4]};
      --elevation-6: ${shadows[6]};
      --elevation-8: ${shadows[8]};
      --elevation-10: ${shadows[10]};
      --elevation-16: ${shadows[16]};
      /* Owned overlays stack against MUI's modals, so the level comes from
         the same theme MUI positions its own surfaces with. */
      --z-modal: ${zIndex.modal};
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

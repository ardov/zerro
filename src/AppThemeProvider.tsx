import React, { FC } from 'react'
import CssBaseline from '@material-ui/core/CssBaseline'
import { ThemeProvider } from '@material-ui/styles'
import { createTheme } from 'helpers/createTheme'
import { useThemeType } from 'helpers/useThemeType'
import { Helmet } from 'react-helmet'
import { createGlobalStyle } from 'styled-components'

export const AppThemeProvider: FC = props => {
  const themeType = useThemeType()
  const theme = createTheme(themeType.type)
  console.log('AppThemeProvider rendered')

  const GlobalStyles = createGlobalStyle`
    html {
      box-sizing: border-box;
      font-family: 'IBM Plex Sans', sans-serif;
    }

    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }

    :root {
      /* TEXT */
      --text-primary: #333;
      --text-secondary: #999;
      --text-placeholder: #aaa;
      --text-success: #21a355;
      /* COLORS */
      --color-danger: #f00;
      --color-accent: #1890ff;
      /* BG */
      --bg-hover: rgba(0, 0, 0, 0.04);
    }

    .hidden-scroll {
      scrollbar-width: none;
      overflow: -moz-scrollbars-none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .red-gradient {
      background-color: rgb(230, 35, 0);
      background-image: linear-gradient(
        105deg,
        rgb(187, 59, 138) 0%,
        rgb(246, 144, 113) 100%
      );
      background-size: 100%;
      background-repeat: repeat;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      -moz-text-fill-color: transparent;
    }
  `

  return (
    <ThemeProvider theme={theme}>
      <>
        <Helmet>
          <meta name="theme-color" content={theme.palette.background.paper} />
        </Helmet>
        <CssBaseline />
        <GlobalStyles />
        {props.children}
      </>
    </ThemeProvider>
  )
}

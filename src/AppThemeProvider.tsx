import React, { FC } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider as JSSThemeProvider } from '@mui/styles'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from 'helpers/createTheme'
import { useThemeType } from 'helpers/useThemeType'
import { Helmet } from 'react-helmet'
import { Global, css } from '@emotion/react'

const GlobalVaribles = (props: { theme: DefaultTheme }) => {
  const styles = css`
    :root {
      --c-bg: ${props.theme.palette.background.default};
      --c-scrollbar: ${props.theme.palette.divider};
    }
  `
  return <Global styles={styles} />
}

const globalStyles = css`
  html {
    box-sizing: border-box;
    font-family: 'IBM Plex Sans', sans-serif;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  ::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  ::-webkit-scrollbar-corner {
    background: var(--c-bg);
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--c-scrollbar);
    border-radius: 6px;
    border: 2px solid var(--c-bg);
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

export const AppThemeProvider: FC = props => {
  const themeType = useThemeType()
  const theme = createTheme(themeType.type)
  return (
    <JSSThemeProvider theme={theme}>
      <ThemeProvider theme={theme}>
        <>
          <Helmet>
            <meta name="theme-color" content={theme.palette.background.paper} />
          </Helmet>
          <CssBaseline />
          <GlobalVaribles theme={theme} />
          <Global styles={globalStyles} />
          {props.children}
        </>
      </ThemeProvider>
    </JSSThemeProvider>
  )
}

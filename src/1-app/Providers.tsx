import React from 'react'
import { Provider } from 'react-redux'
import { StyledEngineProvider } from '@mui/material/styles'
import { GlobalStyles } from '@mui/material'
import { store } from 'store'
import { AppThemeProvider } from '6-shared/ui/theme'
import { SnackbarProvider } from '6-shared/ui/SnackbarProvider'
import { LocalizationProvider } from '6-shared/localization'
import type { AppThemeProviderProps } from '6-shared/ui/theme'

export function Providers(props: {
  children: React.ReactNode
  store?: typeof store
  theme?: Pick<AppThemeProviderProps, 'defaultMode' | 'storageManager'>
}) {
  return (
    <StyledEngineProvider injectFirst enableCssLayer>
      {/* Declare the order before Emotion inserts any MUI rules, including in portals. */}
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <Provider store={props.store || store}>
        <LocalizationProvider>
          <AppThemeProvider
            key={props.theme?.defaultMode ?? 'application-theme'}
            {...props.theme}
          >
            <SnackbarProvider>{props.children}</SnackbarProvider>
          </AppThemeProvider>
        </LocalizationProvider>
      </Provider>
    </StyledEngineProvider>
  )
}

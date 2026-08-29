import React from 'react'
import { Provider } from 'react-redux'
import { StyledEngineProvider } from '@mui/material/styles'
import { GlobalStyles } from '@mui/material'
import { store } from 'store'
import { AppThemeProvider } from '6-shared/ui/theme'
import { SnackbarProvider } from '6-shared/ui/SnackbarProvider'
import { TooltipProvider } from '6-shared/ui/Tooltip'
import type { AppThemeProviderProps } from '6-shared/ui/theme'

export function Providers(props: {
  children: React.ReactNode
  store?: typeof store
  theme?: Pick<AppThemeProviderProps, 'defaultMode'>
}) {
  return (
    <StyledEngineProvider injectFirst enableCssLayer>
      {/* Declare the order before Emotion inserts any MUI rules, including in portals. */}
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <Provider store={props.store || store}>
        <AppThemeProvider
          key={props.theme?.defaultMode ?? 'application-theme'}
          {...props.theme}
        >
          <SnackbarProvider>
            {/* One tooltip group for the whole app, so moving along a row of
                icon buttons does not wait out the delay at every one. */}
            <TooltipProvider>{props.children}</TooltipProvider>
          </SnackbarProvider>
        </AppThemeProvider>
      </Provider>
    </StyledEngineProvider>
  )
}

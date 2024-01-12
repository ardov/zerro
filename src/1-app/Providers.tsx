import React from 'react'
import { Provider } from 'react-redux'
import { StyledEngineProvider } from '@mui/material/styles'
import { store } from 'store'
import { AppThemeProvider } from '6-shared/ui/theme'
import { SnackbarProvider } from '6-shared/ui/SnackbarProvider'
import { LocalizationProvider } from '6-shared/localization'

export function Providers(props: {
  children: React.ReactNode
  store?: typeof store
}) {
  return (
    <StyledEngineProvider injectFirst>
      <Provider store={props.store || store}>
        <LocalizationProvider>
          <AppThemeProvider>
            <SnackbarProvider>{props.children}</SnackbarProvider>
          </AppThemeProvider>
        </LocalizationProvider>
      </Provider>
    </StyledEngineProvider>
  )
}

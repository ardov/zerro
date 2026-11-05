import React from 'react'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { AppThemeProvider } from '@/6-shared/ui/theme'
import { Toaster } from '@/6-shared/ui/kit/Toast'
import { TooltipProvider } from '@/6-shared/ui/kit/Tooltip'
import type { AppThemeProviderProps } from '@/6-shared/ui/theme'

export function Providers(props: {
  children: React.ReactNode
  store?: typeof store
  theme?: Pick<AppThemeProviderProps, 'defaultMode'>
}) {
  return (
    <Provider store={props.store || store}>
      <AppThemeProvider {...props.theme}>
        <TooltipProvider>{props.children}</TooltipProvider>
        <Toaster />
      </AppThemeProvider>
    </Provider>
  )
}

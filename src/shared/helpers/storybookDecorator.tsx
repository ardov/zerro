import React from 'react'
import { ThemeProvider } from '@mui/styles'
import { Box, BoxProps } from '@mui/material'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import ruDateLocale from 'date-fns/locale/ru'
import { Provider } from 'react-redux'
import { store } from 'store'

import { createTheme } from 'shared/helpers/createTheme'

const decorator = (boxProps: BoxProps) => (story: any) =>
  (
    <Provider store={store}>
      <ThemeProvider theme={createTheme()}>
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          locale={ruDateLocale}
        >
          <Box m={4} {...boxProps}>
            {story()}
          </Box>
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  )

export default decorator

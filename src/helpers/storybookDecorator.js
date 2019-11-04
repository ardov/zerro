import React from 'react'
import { ThemeProvider } from '@material-ui/styles'
import { Box } from '@material-ui/core'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateFnsUtils from '@date-io/date-fns'
import ru from 'date-fns/locale/ru'

import createTheme from 'helpers/createTheme'

const decorator = boxProps => story => (
  <ThemeProvider theme={createTheme()}>
    <MuiPickersUtilsProvider utils={DateFnsUtils} locale={ru}>
      <Box m={4} {...boxProps}>
        {story()}
      </Box>
    </MuiPickersUtilsProvider>
  </ThemeProvider>
)

export default decorator

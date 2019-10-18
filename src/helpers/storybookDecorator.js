import React from 'react'
import { ThemeProvider } from '@material-ui/styles'
import { Box } from '@material-ui/core'

import createTheme from 'helpers/createTheme'

const decorator = boxProps => story => (
  <ThemeProvider theme={createTheme()}>
    <Box m={4} {...boxProps}>
      {story()}
    </Box>
  </ThemeProvider>
)

export default decorator

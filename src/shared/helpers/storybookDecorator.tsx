import React from 'react'
import { Box, BoxProps } from '@mui/material'
import { store } from '@store'
import { Providers } from 'app/Providers'

const decorator = (boxProps: BoxProps) => (story: any) =>
  (
    <Providers store={store}>
      <Box m={4} {...boxProps}>
        {story()}
      </Box>
    </Providers>
  )

export default decorator

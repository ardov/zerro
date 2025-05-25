import React from 'react'
import { Box, BoxProps } from '@mui/material'
import { store } from 'store'
import { Providers } from '1-app/Providers'

const decorator = (boxProps: BoxProps) => (story: any) => (
  <Providers store={store}>
    <Box
      {...boxProps}
      sx={[
        {
          m: 4,
        },
        ...(Array.isArray(boxProps.sx) ? boxProps.sx : [boxProps.sx]),
      ]}
    >
      {story()}
    </Box>
  </Providers>
)

export default decorator

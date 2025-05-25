import React from 'react'
import { Box, BoxProps } from '@mui/material'
import { TTransaction } from '6-shared/types'

export type TCardProps = {
  year: string | number
  onShowTransactions: (t: TTransaction[]) => void
}

export const Card = (props: BoxProps) => (
  <Box
    {...props}
    sx={[
      {
        bgcolor: 'background.paper',
        maxWidth: 480,
        minHeight: 280,
        borderRadius: 1,
        py: 4,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
      ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
    ]}
  />
)

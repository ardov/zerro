import React from 'react'
import { Box, BoxProps } from '@mui/material'
import { TTransaction } from '@shared/types'

export type TCardProps = {
  year: string | number
  onShowTransactions: (t: TTransaction[]) => void
}

export const Card = (props: BoxProps) => (
  <Box
    bgcolor="background.paper"
    maxWidth={480}
    minHeight={280}
    borderRadius={1}
    py={4}
    px={2}
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    {...props}
  />
)

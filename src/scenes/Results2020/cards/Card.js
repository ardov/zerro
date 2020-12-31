import React from 'react'
import { Box } from '@material-ui/core'

export const Card = props => (
  <Box
    bgcolor="background.paper"
    maxWidth={480}
    minHeight={280}
    borderRadius={16}
    py={4}
    px={2}
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    {...props}
  />
)

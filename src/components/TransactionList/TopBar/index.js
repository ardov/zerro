import React from 'react'
import Filter from './Filter'
import { Box } from '@material-ui/core'

export default function TopBar(props) {
  return (
    <Box zIndex={10} {...props}>
      <Box position="relative" maxWidth={560} mx="auto">
        <Filter />
      </Box>
    </Box>
  )
}

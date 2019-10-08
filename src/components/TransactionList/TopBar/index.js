import React from 'react'
import Filter from './Filter'
import { Box } from '@material-ui/core'

export default function TopBar({ style }) {
  return (
    <Wrapper style={style}>
      <Filter />
    </Wrapper>
  )
}

const Wrapper = ({ children, ...rest }) => (
  <Box
    position="absolute"
    top={0}
    right={0}
    left={0}
    zIndex={3}
    pt={3}
    px={2}
    bgcolor="background.default"
    {...rest}
  >
    <Box position="relative" maxWidth={560} my={0} mx="auto">
      {children}
    </Box>
  </Box>
)

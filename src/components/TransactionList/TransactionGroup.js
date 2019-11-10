import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { Box, ListSubheader } from '@material-ui/core'
import Transaction from './TransactionContainer'

export default function TransactionGroup({
  style,
  name,
  transactions,
  topOffset = 0,
  opened,
  setOpened,
}) {
  const StyledSubheader = withStyles(theme => ({
    root: { backgroundColor: theme.palette.background.paper },
    sticky: { top: topOffset },
  }))(ListSubheader)

  return (
    <Box style={style}>
      <Box position="relative" maxWidth={560} mx="auto">
        <StyledSubheader>{name}</StyledSubheader>
        {transactions.map(id => (
          <Transaction
            key={id}
            id={id}
            isOpened={id === opened}
            onClick={() => setOpened(id)}
          />
        ))}
      </Box>
    </Box>
  )
}

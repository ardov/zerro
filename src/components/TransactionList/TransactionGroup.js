import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { Box, Paper, ListSubheader } from '@material-ui/core'
import Transaction from './TransactionContainer'

export default function TransactionGroup({
  style,
  name,
  transactions,
  topOffset = 0,
  opened,
  setOpened,
}) {
  const StyledSubheader = withStyles({ sticky: { top: topOffset } })(
    ListSubheader
  )

  return (
    <Box px={2} style={style}>
      <Box
        position="relative"
        maxWidth={560}
        mx="auto"
        py={1}
        component={Paper}
      >
        <StyledSubheader>{name}</StyledSubheader>
        {transactions.map(tr => (
          <Transaction
            key={tr.id}
            id={tr.id}
            isOpened={tr.id === opened}
            onClick={() => setOpened(tr.id)}
          />
        ))}
      </Box>
    </Box>
  )
}

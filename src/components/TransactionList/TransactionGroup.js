import React from 'react'
import { Box, Typography, Paper } from '@material-ui/core'
import Transaction from './Transaction'

export default function TransactionGroup({
  style,
  name,
  transactions,
  topOffset = 0,
}) {
  return (
    <Box px={2} style={style}>
      <Box position="relative" maxWidth={560} mx="auto">
        <Box position="sticky" top={topOffset} zIndex={2} pt={2} pb={1}>
          <Typography color="textSecondary">{name}</Typography>
        </Box>

        <Paper>
          {transactions.map(id => (
            <Transaction key={id.id} id={id.id} />
          ))}
        </Paper>
      </Box>
    </Box>
  )
}

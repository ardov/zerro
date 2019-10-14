import React from 'react'
import { Box, Paper } from '@material-ui/core'
import Transaction from './Transaction'

export default function TransactionGroup({
  style,
  name,
  transactions,
  topOffset = 0,
}) {
  return (
    <Box px={2} style={style}>
      <Box position="relative" maxWidth={560} mx="auto" component={Paper}>
        <Box position="sticky" top={topOffset} zIndex={2} px={2} pt={1}>
          <Box
            bgcolor="background.paper"
            p={1}
            borderRadius={60}
            display="inline-block"
            color="text.secondary"
            children={name}
          />
        </Box>

        {transactions.map(id => (
          <Transaction key={id.id} id={id.id} />
        ))}
      </Box>
    </Box>
  )
}

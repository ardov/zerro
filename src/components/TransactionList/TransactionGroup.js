import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { Box, ListSubheader } from '@material-ui/core'
import Transaction from './TransactionContainer'
import formatDate from './formatDate'

export default function TransactionGroup({
  style,
  date,
  transactions,
  topOffset = 0,
  opened,
  setOpened,
  onSelectDate,
}) {
  const StyledSubheader = withStyles(theme => ({
    root: { backgroundColor: theme.palette.background.paper },
    sticky: { top: topOffset },
  }))(ListSubheader)

  return (
    <Box style={style}>
      <Box position="relative" maxWidth={560} mx="auto">
        <StyledSubheader onClick={() => onSelectDate(date)}>
          {formatDate(date)}
        </StyledSubheader>
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

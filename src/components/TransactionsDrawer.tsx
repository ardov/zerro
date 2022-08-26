import React, { FC } from 'react'
import { TransactionList, TTransactionListProps } from './TransactionList'
import { Drawer, Box, Typography, IconButton, DrawerProps } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Tooltip } from 'shared/ui/Tooltip'
import { CloseIcon } from 'shared/ui/Icons'
import { Modify } from 'shared/types'

export type TransactionsDrawerProps = Modify<
  DrawerProps,
  { onClose: () => void }
> & {
  transactions?: TTransactionListProps['transactions']
  prefilter?: TTransactionListProps['prefilter']
  filterConditions?: TTransactionListProps['filterConditions']
}

export const TransactionsDrawer: FC<TransactionsDrawerProps> = props => {
  const {
    transactions,
    prefilter,
    filterConditions,
    title,
    onClose,
    open,
    ...rest
  } = props
  const c = useStyles()
  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={open}
      classes={{ paper: c.drawerWidth, root: c.drawerWidth }}
      {...rest}
    >
      <Box height="100vh" display="flex" flexDirection="column" minWidth={320}>
        <Box py={1} px={3} display="flex" alignItems="center">
          <Box flexGrow={1}>
            <Typography variant="h6" noWrap>
              {title || 'Операции'}
            </Typography>
          </Box>

          <Tooltip title="Закрыть">
            <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
          </Tooltip>
        </Box>

        <TransactionList
          transactions={transactions}
          prefilter={prefilter}
          filterConditions={filterConditions}
          hideFilter
          sx={{ flex: '1 1 auto' }}
        />
      </Box>
    </Drawer>
  )
}

const useStyles = makeStyles(theme => ({
  drawerWidth: {
    width: 360,
    [theme.breakpoints.down('sm')]: {
      width: '100vw',
    },
  },
}))

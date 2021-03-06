import React, { FC } from 'react'
import TransactionList from './TransactionList'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  makeStyles,
  DrawerProps,
} from '@material-ui/core'
import { Tooltip } from 'components/Tooltip'
import CloseIcon from '@material-ui/icons/Close'
import { FilterConditions } from 'store/localData/transactions/helpers'
import { Modify } from 'types'

type TransactionsDrawerProps = Modify<DrawerProps, { onClose: () => void }> & {
  prefilter?: FilterConditions | FilterConditions[]
  filterConditions: FilterConditions
}

export const TransactionsDrawer: FC<TransactionsDrawerProps> = ({
  prefilter,
  filterConditions,
  title,
  onClose,
  open,
  ...rest
}) => {
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
        <Box flex="1 1 auto" clone>
          <TransactionList
            prefilter={prefilter}
            filterConditions={filterConditions}
            hideFilter
          />
        </Box>
      </Box>
    </Drawer>
  )
}

const useStyles = makeStyles(theme => ({
  drawerWidth: {
    width: 360,
    [theme.breakpoints.down('xs')]: {
      width: '100vw',
    },
  },
}))

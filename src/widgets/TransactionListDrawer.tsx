import React, { useCallback } from 'react'
import { Drawer, Box, Typography, IconButton } from '@mui/material'
import { Tooltip } from '@shared/ui/Tooltip'
import { CloseIcon } from '@shared/ui/Icons'
import { makePopoverHooks } from '@shared/historyPopovers'
import { TransactionList, TTransactionListProps } from './TransactionList'
import { useTransactionPreview } from './TransactionPreviewDrawer'

export type TransactionDrawerProps = {
  title?: string
  transactions?: TTransactionListProps['transactions']
  filterConditions?: TTransactionListProps['filterConditions']
  initialDate?: TTransactionListProps['initialDate']
}

const trDrawerHooks = makePopoverHooks(
  'transaction-list-drawer',
  {} as TransactionDrawerProps
)

export const useTransactionDrawer = trDrawerHooks.useMethods

export const SmartTransactionListDrawer = () => {
  const drawer = trDrawerHooks.useProps()
  const trPreview = useTransactionPreview()
  const { transactions, filterConditions, initialDate, title } =
    drawer.extraProps
  const { onClose, open } = drawer.displayProps

  const showTransaction = useCallback(
    (id: string) => {
      trPreview.open({
        id,
        onOpenOther: (id: string) => {
          trPreview.close()
          showTransaction(id)
        },
        onSelectSimilar: () => {
          // TODO: implement
        },
      })
    },
    [trPreview]
  )
  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={open}
      sx={contentSx}
      keepMounted={false}
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
          filterConditions={filterConditions}
          initialDate={initialDate}
          onTrOpen={showTransaction}
          hideFilter
          sx={{ flex: '1 1 auto' }}
        />
      </Box>
    </Drawer>
  )
}

const drawerWidth = { xs: '100vw', sm: 360 }
const contentSx = {
  width: drawerWidth,
  [`& .MuiDrawer-paper`]: { width: drawerWidth },
}

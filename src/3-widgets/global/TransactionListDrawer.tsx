import type { TTransaction } from '6-shared/types'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Drawer, Box, Typography, IconButton } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'
import { CloseIcon } from '6-shared/ui/Icons'
import { registerPopover } from '6-shared/historyPopovers'
import * as core from 'zerro-core/redux'

import {
  TransactionList,
  TTransactionListProps,
} from '../transaction/TransactionList'
import { useTransactionPreview } from './TransactionPreviewDrawer'

export type TransactionDrawerProps = {
  title?: string
  transactions?: TTransaction[]
  initialQuery?: core.transactions.TTransactionQuery
  initialDate?: TTransactionListProps['initialDate']
}

const trDrawerHooks = registerPopover(
  'transaction-list-drawer',
  {} as TransactionDrawerProps
)

export const useTransactionDrawer = trDrawerHooks.useMethods

const width = { xs: '100vw', sm: 360 }
// MUI Slide uses the modal root as its viewport; only size the paper.
const contentSx = { [`& .MuiDrawer-paper`]: { width } }

export const SmartTransactionListDrawer = () => {
  const { t } = useTranslation('common')
  const drawer = trDrawerHooks.useProps()
  const trPreview = useTransactionPreview()
  const { title, transactions, initialQuery, initialDate } = drawer.extraProps
  const { onClose, open } = drawer.displayProps

  const showTransaction = useCallback(
    function show(id: string) {
      trPreview.open({
        id,
        onOpenOther: (id: string) => {
          trPreview.close()
          show(id)
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
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 320,
        }}
      >
        <Box
          sx={{
            py: 1,
            px: 3,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
            }}
          >
            <Typography variant="h6" noWrap>
              {title || t('transactions')}
            </Typography>
          </Box>

          <Tooltip title={t('close')}>
            <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
          </Tooltip>
        </Box>

        <TransactionList
          transactionIds={transactions?.map(transaction => transaction.id)}
          initialQuery={initialQuery}
          initialDate={initialDate}
          onTrOpen={showTransaction}
          sx={{ flex: '1 1 auto' }}
        />
      </Box>
    </Drawer>
  )
}

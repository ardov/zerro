import type { TISOMonth } from '6-shared/types'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Drawer, Box, Typography, IconButton } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'
import { CloseIcon } from '6-shared/ui/Icons'
import { registerPopover } from '6-shared/historyPopovers'
import { TEnvelopeId } from '5-entities/envelope'
import { transactions as coreTransactions } from 'zerro-core/redux'

import {
  TransactionList,
  TTransactionListProps,
} from '../transaction/TransactionList'
import { useTransactionPreview } from './TransactionPreviewDrawer'

type TEnvConditions = {
  month: TISOMonth
  id: TEnvelopeId | 'transferFees' | null
  isExact?: boolean
  mode?: coreTransactions.TrFilterMode
}

export type EnvTransactionsDrawerProps = {
  title?: string
  initialDate?: TTransactionListProps['initialDate']
  envelopeConditions: TEnvConditions
}

const trDrawerHooks = registerPopover(
  'envelope-transactions-drawer',
  {} as EnvTransactionsDrawerProps
)

export const useEnvTransactionsDrawer = trDrawerHooks.useMethods

const width = { xs: '100vw', sm: 360 }
// MUI Slide uses the modal root as its viewport; only size the paper.
const contentSx = { [`& .MuiDrawer-paper`]: { width } }

export const SmartEnvTransactionsDrawer = () => {
  const { t } = useTranslation('common')
  const drawer = trDrawerHooks.useProps()
  const trPreview = useTransactionPreview()
  const { title, envelopeConditions, initialDate } = drawer.extraProps
  const { onClose, open } = drawer.displayProps
  const initialQuery = useMemo<coreTransactions.TTransactionQuery>(() => {
    if (!envelopeConditions) return { clauses: [] }

    const {
      id,
      month,
      isExact,
      mode = coreTransactions.TrFilterMode.Envelope,
    } = envelopeConditions
    return {
      clauses: [
        {
          kind: 'activity',
          envelopeIds: id === 'transferFees' || id === null ? [] : [id],
          scope: isExact ? 'self' : 'tree',
          mode:
            id === 'transferFees'
              ? coreTransactions.TrFilterMode.TransferFees
              : mode,
          month,
        },
      ],
    }
  }, [envelopeConditions])

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
          initialQuery={initialQuery}
          initialDate={initialDate}
          onTrOpen={showTransaction}
          sx={{ flex: '1 1 auto' }}
        />
      </Box>
    </Drawer>
  )
}

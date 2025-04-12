import type { TISOMonth, TTransaction } from '6-shared/types'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Drawer, Box, Typography, IconButton } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'
import { CloseIcon } from '6-shared/ui/Icons'
import { registerPopover } from '6-shared/historyPopovers'
import { envelopeModel, TEnvelopeId } from '5-entities/envelope'
import { balances, TrFilterMode } from '5-entities/envBalances'
import {
  TransactionList,
  TTransactionListProps,
} from '../transaction/TransactionList'
import { useTransactionPreview } from './TransactionPreviewDrawer'

type TEnvConditions = {
  month: TISOMonth
  id: TEnvelopeId | 'transferFees' | null
  isExact?: boolean
  mode?: TrFilterMode
}

function useFilteredByEnvelope(conditions?: TEnvConditions): TTransaction[] {
  const { id, month, mode = TrFilterMode.Envelope, isExact } = conditions || {}

  const envelopes = envelopeModel.useEnvelopes()
  const fullActivity = balances.useActivity()
  const fullRawActivity = balances.useRawActivity()

  const transactionList = useMemo(() => {
    if (!id || !month) return []
    const activity = fullActivity[month]
    const rawActivity = fullRawActivity[month]
    if (!activity || !rawActivity) return []

    // Return transfer fees
    if (id === 'transferFees') return activity.transferFees.transactions

    // Prepare ids to get transactions
    const ids = isExact ? [id] : [id, ...envelopes[id].children]

    // Prepare and merge transactions
    const transactions = ids
      .map(id => {
        switch (mode) {
          case TrFilterMode.GeneralIncome:
            return activity?.generalIncome.byEnv[id]?.transactions || []
          case TrFilterMode.Envelope:
            return activity?.envActivity.byEnv[id]?.transactions || []
          case TrFilterMode.Income:
            return rawActivity?.income[id]?.transactions || []
          case TrFilterMode.Outcome:
            return rawActivity?.outcome[id]?.transactions || []
          case TrFilterMode.All:
            return [
              ...(rawActivity?.income[id]?.transactions || []),
              ...(rawActivity?.outcome[id]?.transactions || []),
            ]
          default:
            throw new Error(`Unknown mode: ${mode}`)
        }
      })
      .reduce((acc, arr) => acc.concat(arr), [])
    return transactions
  }, [envelopes, fullActivity, fullRawActivity, id, isExact, mode, month])

  return transactionList
}

/*
NOTES

Which transaction filters do I need?

- Envelope drawer

    - all transactions affecting envelope balance
    activity.envActivity.byEnv[id]

- Incomes widget

  - if not keeping income => only general income
  activity.generalIncome.byEnv[id]

  - if keeping income => usual env transaction
  activity.envActivity.byEnv[id]

- Outcomes widget

  - all transactions affecting envelope balance
    activity.envActivity.byEnv[id]

- Transfers & debts widget

  - Envelope transactions + general income transactions
    activity.generalIncome.byEnv[id] + activity.envActivity.byEnv[id]

  - Transfer fees
    activity.transferFees

*/

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
const contentSx = { width, [`& .MuiDrawer-paper`]: { width } }

export const SmartEnvTransactionsDrawer = () => {
  const { t } = useTranslation('common')
  const drawer = trDrawerHooks.useProps()
  const trPreview = useTransactionPreview()
  const { title, envelopeConditions, initialDate } = drawer.extraProps
  const { onClose, open } = drawer.displayProps
  let filteredTransactions = useFilteredByEnvelope(envelopeConditions)

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
          transactions={filteredTransactions}
          initialDate={initialDate}
          onTrOpen={showTransaction}
          hideFilter
          sx={{ flex: '1 1 auto' }}
        />
      </Box>
    </Drawer>
  )
}

import { IconButton } from '6-shared/ui/Button'
import type { TISOMonth } from '6-shared/types'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Drawer } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'
import { CloseIcon } from '6-shared/ui/Icons'
import { registerPopover } from '6-shared/historyPopovers'
import { core } from 'zerro-core/redux'

import type { TTransactionListProps } from '../transaction/TransactionList'
import { TransactionList } from '../transaction/TransactionList'
import { useTransactionPreview } from './TransactionPreviewDrawer'

type TEnvConditions = {
  month: TISOMonth
  id: core.envelopes.TEnvelopeId | 'transferFees' | null
  isExact?: boolean
  mode?: core.transactions.TrFilterMode
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
  const initialQuery = useMemo<core.transactions.TTransactionQuery>(() => {
    if (!envelopeConditions) return { clauses: [] }

    const {
      id,
      month,
      isExact,
      mode = core.transactions.TrFilterMode.Envelope,
    } = envelopeConditions
    return {
      clauses: [
        {
          kind: 'activity',
          envelopeIds: id === 'transferFees' || id === null ? [] : [id],
          scope: isExact ? 'self' : 'tree',
          mode:
            id === 'transferFees'
              ? core.transactions.TrFilterMode.TransferFees
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
      <div className="flex h-screen min-w-80 flex-col">
        <div className="flex items-center px-6 py-2">
          <div className="grow">
            <h2 className="m-0 truncate type-title">
              {title || t('transactions')}
            </h2>
          </div>

          <Tooltip title={t('close')}>
            <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
          </Tooltip>
        </div>

        <TransactionList
          initialQuery={initialQuery}
          initialDate={initialDate}
          onTrOpen={showTransaction}
          className="grow"
        />
      </div>
    </Drawer>
  )
}

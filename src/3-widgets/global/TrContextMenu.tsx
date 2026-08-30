import type { FC } from 'react'
import { Menu, MenuItem } from '6-shared/ui/Menu'
import type { TTransaction, TTransactionId } from '6-shared/types'
import { useAppDispatch, useAppSelector } from 'store'
import { useAsked } from '6-shared/overlays'
import { track } from '6-shared/analytics'
import { core } from 'zerro-core/redux'

import { useTranslation } from 'react-i18next'

/** What the menu can hand back. Everything else it does to the transaction
 * itself, and answers nothing. */
export type TransactionMenuChoice =
  | { kind: 'selectSimilar'; changed: TTransaction['changed'] }
  | { kind: 'markOlderViewed' }

export type TransactionMenuProps = {
  id: TTransactionId
  /** Selecting similar and marking older as viewed both mean something only
   * inside a list, so a preview asks without them. */
  inList?: boolean
  anchorPosition?: { left: number; top: number }
}

/** The transaction's context menu, as a question. The two items that mean
 * something to the list come back as an answer instead of arriving as
 * callbacks: the menu no longer takes on behaviour that is not its own. */
export const TransactionMenu: FC<TransactionMenuProps> = ({
  id,
  inList,
  anchorPosition,
}) => {
  const { t } = useTranslation('transactionContextMenu')
  const { open, answer } = useAsked<TransactionMenuChoice>()
  const dispatch = useAppDispatch()
  const transaction = useAppSelector(
    state => core.transactions.selectAll(state)[id]
  )

  const editable = transaction ? transaction.deleted === false : false
  const viewed = transaction ? core.transactions.isViewed(transaction) : false

  const options = transaction
    ? [
        {
          label: t('restore'),
          condition: transaction.deleted,
          action: () => {
            answer()
            dispatch(core.transactions.restore(id))
            track('transaction_restored', { source: 'context_menu' })
          },
        },
        {
          label: t('markViewed'),
          condition: editable && !viewed,
          action: () => {
            answer()
            dispatch(core.transactions.setViewed([id], true))
            track('transaction_viewed_changed', {
              viewed: true,
              mode: 'single',
              source: 'context_menu',
            })
          },
        },
        {
          label: t('markUnviewed'),
          condition: editable && viewed,
          action: () => {
            answer()
            dispatch(core.transactions.setViewed([id], false))
            track('transaction_viewed_changed', {
              viewed: false,
              mode: 'single',
              source: 'context_menu',
            })
          },
        },
        {
          label: t('markViewedOlder'),
          condition: !!inList,
          action: () => answer({ kind: 'markOlderViewed' }),
        },
        {
          label: t('selectSimilar'),
          condition: !!inList,
          action: () =>
            answer({ kind: 'selectSimilar', changed: transaction.changed }),
        },
        {
          label: t('delete'),
          condition: !transaction.deleted,
          action: () => {
            answer()
            dispatch(core.transactions.remove([id]))
            track('transaction_deleted', {
              mode: 'single',
              source: 'context_menu',
            })
          },
        },
      ]
    : []

  return (
    <Menu open={open} onClose={() => answer()} anchorPosition={anchorPosition}>
      {options
        .filter(({ condition }) => condition)
        .map(({ label, action }) => (
          <MenuItem key={label} onClick={action}>
            {label}
          </MenuItem>
        ))}
    </Menu>
  )
}

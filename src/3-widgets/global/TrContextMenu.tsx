import type { FC } from 'react'
import {
  MenuSurface,
  type MenuItem,
  type MenuSurfaceProps,
} from '@/6-shared/ui/kit/Menu'
import type { TTransaction, TTransactionId } from '@/6-shared/types'
import { useAppDispatch, useAppSelector } from '@/store'
import { useAsked } from '@/6-shared/overlays'
import { track } from '@/6-shared/analytics'
import { core } from '@/zerro-core/redux'

import { useTranslation } from 'react-i18next'

export type TransactionMenuProps = {
  id: TTransactionId
  anchor: MenuSurfaceProps['anchor']
  /** List actions. Each item is shown only when its handler is passed. */
  onSelectSimilar?: (changed: TTransaction['changed']) => void
  onMarkOlderViewed?: () => void
  onFilterMerchant?: (id: string) => void
  onSearchPayee?: (name: string) => void
}

/** The transaction's context menu, asked from a context gesture. */
export const TransactionMenu: FC<TransactionMenuProps> = props => {
  const {
    id,
    anchor,
    onSelectSimilar,
    onMarkOlderViewed,
    onFilterMerchant,
    onSearchPayee,
  } = props
  const { t } = useTranslation('transactionContextMenu')
  const { controller } = useAsked<void>()
  const dispatch = useAppDispatch()
  const transaction = useAppSelector(
    state => core.transactions.selectAll(state)[id]
  )

  const merchants = core.merchants.useAll()
  const items: MenuItem[] = []
  if (transaction) {
    const merchant = transaction.merchant && merchants[transaction.merchant]
    if (merchant && onFilterMerchant) {
      items.push({
        id: 'filterMerchant',
        label: t('filterMerchant', { name: merchant.title }),
        onSelect: () => onFilterMerchant(merchant.id),
      })
    } else if (!transaction.merchant && transaction.payee && onSearchPayee) {
      const name = transaction.payee
      items.push({
        id: 'searchPayee',
        label: t('searchPayee', { name }),
        onSelect: () => onSearchPayee(name),
      })
    }
    const viewed = core.transactions.isViewed(transaction)
    if (transaction.deleted) {
      items.push({
        id: 'restore',
        label: t('restore'),
        onSelect: () => {
          dispatch(core.transactions.restore(id))
          track('transaction_restored', { source: 'context_menu' })
        },
      })
    } else {
      items.push({
        id: 'viewed',
        label: t(viewed ? 'markUnviewed' : 'markViewed'),
        onSelect: () => {
          dispatch(core.transactions.setViewed([id], !viewed))
          track('transaction_viewed_changed', {
            viewed: !viewed,
            mode: 'single',
            source: 'context_menu',
          })
        },
      })
    }
    if (onMarkOlderViewed) {
      items.push({
        id: 'markViewedOlder',
        label: t('markViewedOlder'),
        onSelect: onMarkOlderViewed,
      })
    }
    if (onSelectSimilar) {
      items.push({
        id: 'selectSimilar',
        label: t('selectSimilar'),
        onSelect: () => onSelectSimilar(transaction.changed),
      })
    }
    if (!transaction.deleted) {
      items.push({
        id: 'delete',
        label: t('delete'),
        onSelect: () => {
          dispatch(core.transactions.remove([id]))
          track('transaction_deleted', {
            mode: 'single',
            source: 'context_menu',
          })
        },
      })
    }
  }

  return (
    <MenuSurface
      label={t('common:actions')}
      controller={controller}
      anchor={anchor}
      items={items}
    />
  )
}

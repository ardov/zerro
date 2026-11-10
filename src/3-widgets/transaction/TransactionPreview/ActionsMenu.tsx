import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCachedValue } from '@/6-shared/hooks/useCachedValue'
import { useLocalDay } from '@/6-shared/hooks/useLocalDay'
import { usePopup } from '@/6-shared/overlays'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { Menu, type MenuItem } from '@/6-shared/ui/kit/Menu'
import {
  CopyIcon,
  DeleteIcon,
  MoreVertIcon,
  RestoreFromTrashIcon,
  SearchIcon,
  VisibilityIcon,
} from '@/6-shared/ui/Icons'
import type { TRelatedList } from './relatedLists'

export type TransactionActions = {
  onCopy: () => void
  onDelete: () => void
  onRestore: () => void
  onSetViewed: (viewed: boolean) => void
  /** Lists this transaction leads to. Offered where one can be opened. */
  lists: readonly TRelatedList[]
  onOpenList: (list: TRelatedList) => void
}

export function ActionsMenu(
  props: TransactionActions & { deleted: boolean; viewed: boolean }
) {
  const {
    deleted,
    viewed,
    onCopy,
    onDelete,
    onRestore,
    onSetViewed,
    lists,
    onOpenList,
  } = props
  const { t, i18n } = useTranslation(['transaction', 'transactionContextMenu'])
  const popup = usePopup()
  const counts = useListCounts(lists, popup.open)
  // What changes this transaction comes first; where it leads comes after.
  const items: MenuItem[] = [
    {
      id: 'copy',
      start: <CopyIcon />,
      label: t('transactionContextMenu:copy'),
      onSelect: onCopy,
    },
  ]
  if (!deleted)
    items.push({
      id: 'viewed',
      start: <VisibilityIcon />,
      label: t(
        viewed
          ? 'transactionContextMenu:markUnviewed'
          : 'transactionContextMenu:markViewed'
      ),
      onSelect: () => onSetViewed(!viewed),
    })
  items.push(
    deleted
      ? {
          id: 'restore',
          start: <RestoreFromTrashIcon />,
          label: t('btnRestore'),
          onSelect: onRestore,
        }
      : {
          id: 'delete',
          start: <DeleteIcon />,
          label: t('btnDelete'),
          destructive: true,
          onSelect: onDelete,
        }
  )
  if (lists.length) {
    items.push({ id: 'lists', type: 'separator' })
    lists.forEach((list, index) => {
      items.push({
        id: list.id,
        start: <SearchIcon />,
        label: list.label,
        end: counts?.[index].toLocaleString(i18n.language),
        onSelect: () => onOpenList(list),
      })
    })
  }
  return (
    <Menu
      label={t('btnActions')}
      popup={popup}
      items={items}
      trigger={
        <IconButton variant="ghost" size="sm" label={t('btnActions')}>
          <MoreVertIcon />
        </IconButton>
      }
    />
  )
}

/** How many transactions each list would show. Counted only for an open menu,
 * and kept while it closes so the numbers do not vanish mid-exit. */
function useListCounts(lists: readonly TRelatedList[], open: boolean) {
  const transactions = useAppSelector(core.transactions.selectAll)
  const context = useAppSelector(core.transactions.selectQueryContext)
  const today = useLocalDay()
  const counts = useMemo(() => {
    if (!open) return undefined
    const checks = lists.map(list =>
      core.transactions.compileQuery(list.query, context, today)
    )
    const counts = checks.map(() => 0)
    Object.values(transactions).forEach(transaction =>
      checks.forEach((check, index) => {
        if (check(transaction)) counts[index]++
      })
    )
    return counts
  }, [open, lists, transactions, context, today])
  return useCachedValue(counts, open)
}

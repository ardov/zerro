import type {
  ByDate,
  TDateDraft,
  TISODate,
  TTransactionId,
} from '@/6-shared/types'
import { core } from '@/zerro-core/redux'

import type { FC } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { useMemo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { track } from '@/6-shared/analytics'
import { useBreakpointDown } from '@/6-shared/hooks/useBreakpointDown'

import { getEventAnchor } from '@/3-widgets/global/shared/helpers'

import { GroupedList } from './GroupedList'
import type { ListTransactions } from './useListTransactions'
import Filter from './TopBar/Filter'
import type { SummaryToggle } from './TopBar/SummaryButton'
import { upsertFilter } from './TopBar/filterModel'
import Actions from './TopBar/Actions'
import { Transaction } from './Transaction'
import { TransactionMenu } from '@/3-widgets/global/TrContextMenu'
import { useAsk } from '@/6-shared/overlays'
import { useAppDispatch, useAppSelector } from '@/store'

export type TTransactionListProps = {
  onTrOpen?: (id: TTransactionId) => void
  opened?: TTransactionId
  list: ListTransactions
  hideFilter?: boolean
  initialDate?: TDateDraft
  view: TTransactionListView
  summary?: SummaryToggle
  className?: string
}

export type TTransactionListView = {
  query: core.transactions.TTransactionQuery
  search: string
  restoredTopDate: TISODate | null
  restoredScrollOffset: number | null
  checked: TTransactionId[]
  onQueryChange: (query: core.transactions.TTransactionQuery) => void
  onSearchChange: (search: string) => void
  onCheckedChange: (checked: TTransactionId[]) => void
  onScrollChange: (date: TISODate, scrollOffset: number) => void
}

export const TransactionList: FC<TTransactionListProps> = props => {
  const {
    onTrOpen,
    opened,
    list,
    hideFilter = false,
    initialDate,
    view,
    summary,
    className,
  } = props

  const isMobile = useBreakpointDown('md')
  const dispatch = useAppDispatch()
  const {
    query,
    search,
    onQueryChange,
    onSearchChange,
    checked: checkedIds,
    onCheckedChange: setChecked,
  } = view
  const onFilterByMerchant = useCallback(
    (merchant: string) => {
      onQueryChange(upsertFilter(query, { kind: 'merchant', ids: [merchant] }))
    },
    [onQueryChange, query]
  )

  const { transactions: trList, quickFilters, setPreview, previewing } = list

  const allTransactions = useAppSelector(core.transactions.selectAll)
  // A saved selection can outlive transactions removed while on another page.
  const checked = useMemo(
    () => checkedIds.filter(id => allTransactions[id]),
    [checkedIds, allTransactions]
  )
  const selectionAnchor = useRef<TTransactionId | null>(null)
  useEffect(() => {
    if (
      selectionAnchor.current !== null &&
      !trList.some(tr => tr.id === selectionAnchor.current)
    )
      selectionAnchor.current = null
  }, [trList])
  const uncheckAll = useCallback(() => {
    selectionAnchor.current = null
    setChecked([])
  }, [setChecked])
  const checkAll = useCallback(() => {
    selectionAnchor.current = null
    setChecked(trList.map(tr => tr.id))
  }, [trList, setChecked])
  const toggleTransaction = useCallback(
    (id: TTransactionId, extendRange = false) => {
      const anchorIndex = extendRange
        ? trList.findIndex(tr => tr.id === selectionAnchor.current)
        : -1
      const targetIndex = extendRange
        ? trList.findIndex(tr => tr.id === id)
        : -1
      selectionAnchor.current = id
      if (anchorIndex >= 0 && targetIndex >= 0) {
        const range = trList.slice(
          Math.min(anchorIndex, targetIndex),
          Math.max(anchorIndex, targetIndex) + 1
        )
        const rangeIds = new Set(range.map(tr => tr.id))
        setChecked(
          checked.includes(id)
            ? checked.filter(id => !rangeIds.has(id))
            : [...new Set([...checked, ...rangeIds])]
        )
      } else {
        setChecked(
          checked.includes(id)
            ? checked.filter(checked => id !== checked)
            : [...checked, id]
        )
      }
    },
    [checked, setChecked, trList]
  )
  const onSelectSimilar = useCallback(
    (date: Date | number) => {
      const ids = trList.filter(tr => tr.changed === +date).map(tr => tr.id)
      selectionAnchor.current = null
      setChecked(ids)
      track('similar_transactions_selected', {})
    },
    [trList, setChecked]
  )
  const onMarkOlderViewed = useCallback(
    (id: TTransactionId) => {
      const index = trList.findIndex(tr => tr.id === id)
      if (index === -1) return
      const ids = trList
        .slice(index)
        .filter(tr => !core.transactions.isViewed(tr))
        .map(tr => tr.id)
      dispatch(core.transactions.setViewed(ids, true))
      track('transactions_older_marked_viewed', {})
    },
    [dispatch, trList]
  )

  const ask = useAsk()

  // Group IDs by list data alone; render heavy rows only when the virtualizer mounts them.
  const groups = useMemo(() => {
    const byDate: ByDate<{ date: TISODate; ids: TTransactionId[] }> = {}
    trList.forEach(tr => {
      byDate[tr.date] ??= { date: tr.date, ids: [] }
      byDate[tr.date].ids.push(tr.id)
    })
    return Object.values(byDate)
  }, [trList])

  const onContextMenu = useCallback(
    (e: React.MouseEvent | React.TouchEvent, id: TTransactionId) =>
      ask(
        <TransactionMenu
          id={id}
          anchor={getEventAnchor(e)}
          onFilterMerchant={hideFilter ? undefined : onFilterByMerchant}
          onSearchPayee={hideFilter ? undefined : onSearchChange}
          onSelectSimilar={onSelectSimilar}
          onMarkOlderViewed={() => onMarkOlderViewed(id)}
        />
      ),
    [
      ask,
      onSelectSimilar,
      onMarkOlderViewed,
      hideFilter,
      onFilterByMerchant,
      onSearchChange,
    ]
  )

  const checkedSet = useMemo(() => new Set(checked), [checked])
  const isInSelectionMode = checked.length > 0

  const renderTransaction = useCallback(
    (id: TTransactionId) => (
      <Transaction
        key={id}
        id={id}
        isOpened={id === opened}
        isChecked={checkedSet.has(id)}
        isInSelectionMode={isInSelectionMode}
        onOpen={onTrOpen}
        onToggle={toggleTransaction}
        onContextMenu={onContextMenu}
        onFilterMerchant={
          hideFilter || isMobile ? undefined : onFilterByMerchant
        }
        onSearchPayee={hideFilter || isMobile ? undefined : onSearchChange}
      />
    ),
    [
      opened,
      checkedSet,
      isInSelectionMode,
      onTrOpen,
      toggleTransaction,
      onContextMenu,
      hideFilter,
      isMobile,
      onFilterByMerchant,
      onSearchChange,
    ]
  )

  const scrollKey = useMemo(() => ({ query, search }), [query, search])
  const header = !hideFilter ? (
    <div className="transaction-list-width w-full px-2 pt-2">
      <Filter
        quickFilters={quickFilters}
        onPreviewChange={setPreview}
        query={query}
        onQueryChange={onQueryChange}
        search={search}
        onSearchChange={onSearchChange}
        summary={summary}
      />
    </div>
  ) : undefined

  return (
    <div className={cn('relative flex min-h-0 flex-col', className)}>
      <Actions
        visible={Boolean(checked.length)}
        checkedIds={checked}
        onUncheckAll={uncheckAll}
        onCheckAll={checkAll}
      />
      <div className="min-h-0 flex-1">
        <GroupedList
          groups={groups}
          renderTransaction={renderTransaction}
          initialDate={initialDate}
          restoredTopDate={view.restoredTopDate}
          restoredScrollOffset={view.restoredScrollOffset}
          scrollKey={previewing ? null : scrollKey}
          onScrollChange={view.onScrollChange}
          header={header}
          emptyState={<EmptyState />}
        />
      </div>
    </div>
  )
}

const EmptyState = () => {
  const { t } = useTranslation('transactions')
  return (
    <div className="p-10">
      <p className="mt-0 mb-4 text-center text-body">{t('emptyState')}</p>
    </div>
  )
}

import type {
  ByDate,
  TDateDraft,
  TISODate,
  TTransactionId,
} from '@/6-shared/types'
import { core } from '@/zerro-core/redux'

import type { FC } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { track } from '@/6-shared/analytics'
import { useBreakpointDown } from '@/6-shared/hooks/useBreakpointDown'
import { useLocalDay } from '@/6-shared/hooks/useLocalDay'
import { useDebounce } from '@/6-shared/hooks/useDebounce'

import { getEventAnchor } from '@/3-widgets/global/shared/helpers'

import { GroupedList } from './GroupedList'
import Filter from './TopBar/Filter'
import { upsertFilter } from './TopBar/filterModel'
import Actions from './TopBar/Actions'
import { Transaction } from './Transaction'
import { TransactionMenu } from '@/3-widgets/global/TrContextMenu'
import { useAsk } from '@/6-shared/overlays'
import { useAppDispatch, useAppSelector } from '@/store'

export type TTransactionListProps = {
  onTrOpen?: (id: TTransactionId) => void
  opened?: TTransactionId
  transactionIds?: TTransactionId[]
  initialQuery?: core.transactions.TTransactionQuery
  hideFilter?: boolean
  checkedDate?: Date | null
  initialDate?: TDateDraft
  view?: TTransactionListView
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
    transactionIds,
    initialQuery,
    hideFilter = false,
    checkedDate,
    initialDate,
    view,
    className,
  } = props

  const isMobile = useBreakpointDown('md')
  const dispatch = useAppDispatch()
  const [localQuery, setLocalQuery] =
    useState<core.transactions.TTransactionQuery>(() => ({
      clauses:
        initialQuery?.clauses.filter(clause => clause.kind !== 'search') || [],
    }))
  const [localSearch, setLocalSearch] = useState(
    () =>
      initialQuery?.clauses.find(clause => clause.kind === 'search')?.value ||
      ''
  )
  const query = view?.query ?? localQuery
  const search = view?.search ?? localSearch
  const onQueryChange = view?.onQueryChange ?? setLocalQuery
  const onSearchChange = view?.onSearchChange ?? setLocalSearch
  const debouncedSearch = useDebounce(search, 300)
  const appliedQuery = useMemo<core.transactions.TTransactionQuery>(
    () => ({
      clauses: [
        ...query.clauses,
        ...(debouncedSearch
          ? [{ kind: 'search' as const, value: debouncedSearch }]
          : []),
      ],
    }),
    [debouncedSearch, query]
  )
  const onFilterByMerchant = useCallback(
    (merchant: string) => {
      onQueryChange(upsertFilter(query, { kind: 'merchant', ids: [merchant] }))
    },
    [onQueryChange, query]
  )

  const trList = useFilteredTransactions(transactionIds, appliedQuery)

  const [localChecked, setLocalChecked] = useState<TTransactionId[]>([])
  const checkedIds = view?.checked ?? localChecked
  const setChecked = view?.onCheckedChange ?? setLocalChecked
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

  const prevCheckedDate = useRef(checkedDate)
  useEffect(() => {
    if (prevCheckedDate.current === checkedDate) return
    prevCheckedDate.current = checkedDate
    if (checkedDate) onSelectSimilar(checkedDate)
  }, [checkedDate, onSelectSimilar])

  // Groups carry only ids and depend on the list alone, so opening or checking
  // a transaction never rebuilds them. The heavy `<Transaction>` elements are
  // created lazily by `renderTransaction`, only for the rows the virtualizer
  // actually mounts.
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

  const header = !hideFilter ? (
    <div className="transaction-list-width w-full px-2 pt-2">
      <Filter
        query={query}
        onQueryChange={onQueryChange}
        search={search}
        onSearchChange={onSearchChange}
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
          restoredTopDate={view?.restoredTopDate}
          restoredScrollOffset={view?.restoredScrollOffset}
          onScrollChange={view?.onScrollChange}
          header={header}
          emptyState={<EmptyState />}
        />
      </div>
    </div>
  )
}

function useFilteredTransactions(
  trIds?: TTransactionId[],
  query: core.transactions.TTransactionQuery = { clauses: [] }
) {
  const transactionsById = useAppSelector(core.transactions.selectAll)
  const allTransactionIds = useAppSelector(core.transactions.selectIds)
  const context = useAppSelector(core.transactions.selectQueryContext)
  const today = useLocalDay()
  // Ordering depends on the data, not on each search or filter change.
  const ordered = useMemo(
    () =>
      (trIds || allTransactionIds)
        .map(id => transactionsById[id])
        .filter(
          (transaction): transaction is NonNullable<typeof transaction> =>
            !!transaction
        )
        .sort(core.transactions.compareTransactionDates),
    [trIds, allTransactionIds, transactionsById]
  )
  return useMemo(() => {
    const checker = core.transactions.compileQuery(query, context, today)
    return ordered.filter(checker)
  }, [ordered, context, query, today])
}

const EmptyState = () => {
  const { t } = useTranslation('transactions')
  return (
    <div className="p-10">
      <p className="mt-0 mb-4 text-center text-body">{t('emptyState')}</p>
    </div>
  )
}

import type { SxProps } from '@mui/system'
import type {
  ByDate,
  TDateDraft,
  TISODate,
  TTransactionId,
} from '6-shared/types'
import { core } from 'zerro-core/redux'

import type { FC } from 'react'
import { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Theme } from '@mui/material'
import { Box, Typography } from '@mui/material'
import { track } from '6-shared/analytics'
import { useDebounce } from '6-shared/hooks/useDebounce'

import { getEventPosition } from '3-widgets/global/shared/helpers'

import { GrouppedList } from './GrouppedList'
import Filter from './TopBar/Filter'
import Actions from './TopBar/Actions'
import { Transaction } from './Transaction'
import { useTrContextMenu } from '3-widgets/global/TrContextMenu'
import { useAppDispatch, useAppSelector } from 'store'

export type TTransactionListProps = {
  onTrOpen?: (id: TTransactionId) => void
  opened?: TTransactionId
  transactionIds?: TTransactionId[]
  initialQuery?: core.transactions.TTransactionQuery
  hideFilter?: boolean
  checkedDate?: Date | null
  initialDate?: TDateDraft
  view?: TTransactionListView
  sx?: SxProps<Theme>
}

export type TTransactionListView = {
  query: core.transactions.TTransactionQuery
  search: string
  restoredTopDate: TISODate | null
  onQueryChange: (query: core.transactions.TTransactionQuery) => void
  onSearchChange: (search: string) => void
  onTopDateChange: (date: TISODate) => void
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
    sx,
  } = props

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
  const onFilterByPayee = useCallback(
    (payee?: string) => onSearchChange(payee || ''),
    [onSearchChange]
  )

  const trList = useFilteredTransactions(transactionIds, appliedQuery)

  const [checked, setChecked] = useState<TTransactionId[]>([])
  const uncheckAll = useCallback(() => setChecked([]), [])
  const checkAll = useCallback(
    () => setChecked(trList.map(tr => tr.id)),
    [trList]
  )
  const toggleTransaction = useCallback((id: TTransactionId) => {
    setChecked(current => {
      return current.includes(id)
        ? current.filter(checked => id !== checked)
        : [...current, id]
    })
  }, [])
  const onSelectSimilar = useCallback(
    (date: Date | number) => {
      const ids = trList.filter(tr => tr.changed === +date).map(tr => tr.id)
      setChecked(ids)
      track('similar_transactions_selected', {})
    },
    [trList]
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

  const openContextMenu = useTrContextMenu()

  const [prevCheckedDate, setPrevCheckedDate] = useState(checkedDate)
  if (prevCheckedDate !== checkedDate) {
    setPrevCheckedDate(checkedDate)
    if (checkedDate) onSelectSimilar(checkedDate)
  }

  // Groups carry only ids and depend on the list alone, so opening or checking
  // a transaction never rebuilds them. The heavy `<Transaction>` elements are
  // created lazily by `renderTransaction`, only for the groups react-window
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
      openContextMenu(
        { id, onSelectSimilar, onMarkOlderViewed },
        getEventPosition(e)
      ),
    [openContextMenu, onSelectSimilar, onMarkOlderViewed]
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
        onPayeeClick={onFilterByPayee}
        onContextMenu={onContextMenu}
      />
    ),
    [
      opened,
      checkedSet,
      isInSelectionMode,
      onTrOpen,
      toggleTransaction,
      onFilterByPayee,
      onContextMenu,
    ]
  )

  return (
    <>
      <Box
        sx={[
          {
            display: 'flex',
            flexDirection: 'column',
            px: 1,
            pt: 1,
            position: 'relative',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {!hideFilter && (
          <Box
            sx={{
              position: 'relative',
              zIndex: 10,
              maxWidth: 560,
              width: '100%',
              mx: 'auto',
            }}
          >
            <Filter
              query={query}
              onQueryChange={onQueryChange}
              search={search}
              onSearchChange={onSearchChange}
            />
          </Box>
        )}

        <Actions
          visible={Boolean(checked?.length)}
          checkedIds={checked}
          onUncheckAll={uncheckAll}
          onCheckAll={checkAll}
        />

        <Box sx={{ flex: '1 1 auto' }}>
          {groups.length ? (
            <GrouppedList
              {...{
                groups,
                renderTransaction,
                initialDate,
                restoredTopDate: view?.restoredTopDate,
                onTopDateChange: view?.onTopDateChange,
              }}
            />
          ) : (
            <EmptyState />
          )}
        </Box>
      </Box>
    </>
  )
}

function useFilteredTransactions(
  trIds?: TTransactionId[],
  query: core.transactions.TTransactionQuery = { clauses: [] }
) {
  const transactionsById = useAppSelector(core.transactions.selectAll)
  const allTransactionIds = useAppSelector(core.transactions.selectIds)
  const routing = useAppSelector(core.activity.selectTransactionRoutingContext)
  const envelopes = useAppSelector(core.envelopes.selectDomain)
  const keepingEnvelopeIds = useAppSelector(core.envelopes.selectKeepingIds)
  const context = useMemo<core.transactions.TTransactionQueryContext>(
    () => ({ routing, envelopes, keepingEnvelopeIds }),
    [envelopes, keepingEnvelopeIds, routing]
  )
  const groups = useMemo(() => {
    const checker = core.transactions.compileQuery(query, context)
    const list = trIds || allTransactionIds
    return list
      .map(id => transactionsById[id])
      .filter(checker)
      .sort(core.transactions.compareTransactionDates)
  }, [trIds, allTransactionIds, context, query, transactionsById])
  return groups
}

const EmptyState = () => {
  const { t } = useTranslation('transactions')
  return (
    <div className="p-10">
      <Typography variant="body1" align="center" className="mb-4">
        {t('emptyState')}
      </Typography>
    </div>
  )
}

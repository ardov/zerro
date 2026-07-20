import type { SxProps } from '@mui/system'
import type {
  ByDate,
  TDateDraft,
  TISODate,
  TTransactionId,
} from '6-shared/types'
import * as core from 'zerro-core/redux'

import { useMemo, useState, useCallback, FC, ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Theme } from '@mui/material'
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
  sx?: SxProps<Theme>
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
    sx,
  } = props

  const dispatch = useAppDispatch()
  const [query, setQuery] = useState<core.transactions.TTransactionQuery>(
    () => ({
      clauses:
        initialQuery?.clauses.filter(clause => clause.kind !== 'search') || [],
    })
  )
  const [search, setSearch] = useState(
    () =>
      initialQuery?.clauses.find(clause => clause.kind === 'search')?.value ||
      ''
  )
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
    (payee?: string) => setSearch(payee || ''),
    []
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

  const groups = useMemo(() => {
    const groups: ByDate<{ date: TISODate; transactions: ReactElement[] }> = {}
    trList.forEach(tr => {
      const Component = (
        <Transaction
          key={tr.id}
          id={tr.id}
          isOpened={tr.id === opened}
          isChecked={checked.includes(tr.id)}
          isInSelectionMode={!!checked.length}
          onOpen={onTrOpen}
          onToggle={toggleTransaction}
          onPayeeClick={onFilterByPayee}
          onContextMenu={(e, id) =>
            openContextMenu(
              { id, onSelectSimilar, onMarkOlderViewed },
              getEventPosition(e)
            )
          }
        />
      )
      groups[tr.date] ??= { date: tr.date, transactions: [] }
      groups[tr.date].transactions.push(Component)
    })
    return Object.values(groups)
  }, [
    trList,
    opened,
    checked,
    onTrOpen,
    toggleTransaction,
    onFilterByPayee,
    openContextMenu,
    onSelectSimilar,
    onMarkOlderViewed,
  ])

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
              setQuery={setQuery}
              search={search}
              setSearch={setSearch}
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
            <GrouppedList {...{ groups, initialDate }} />
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
    <Box sx={{ p: 5 }}>
      <Typography variant="body1" align="center" sx={{ marginBottom: '16px' }}>
        {t('emptyState')}
      </Typography>
    </Box>
  )
}

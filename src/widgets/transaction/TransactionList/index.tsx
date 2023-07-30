import type { SxProps } from '@mui/system'
import type {
  ByDate,
  TDateDraft,
  TISODate,
  TTransaction,
  TTransactionId,
} from '@shared/types'
import type { TrCondition, TrConditions } from '@entities/transaction'

import React, { useMemo, useState, useCallback, useEffect, FC } from 'react'
import { Box, Typography, Theme } from '@mui/material'
import { sendEvent } from '@shared/helpers/tracking'
import { useDebounce } from '@shared/hooks/useDebounce'
import { accountModel } from '@entities/account'
import { trModel } from '@entities/transaction'

import { GrouppedList } from './GrouppedList'
import Filter from './TopBar/Filter'
import Actions from './TopBar/Actions'
import { Transaction } from './Transaction'
import { TransactionMenu, useTrContextMenu } from './ContextMenu'

export type TTransactionListProps = {
  onTrOpen?: (id: TTransactionId) => void
  opened?: TTransactionId
  transactions?: TTransaction[]
  preFilter?: TrConditions
  initialFilter?: TrCondition
  hideFilter?: boolean
  checkedDate?: Date | null
  initialDate?: TDateDraft
  sx?: SxProps<Theme>
}

export const TransactionList: FC<TTransactionListProps> = props => {
  const {
    onTrOpen,
    opened,
    transactions,
    preFilter,
    initialFilter: defaultConditions,
    hideFilter = false,
    checkedDate,
    initialDate,
    sx,
  } = props

  const [filter, setFilter] = useState(defaultConditions)
  const setCondition = useCallback(
    (condition?: TrConditions) =>
      setFilter(filter => {
        return { ...filter, ...condition }
      }),
    []
  )
  const handleClearFilter = useCallback(() => {
    setFilter(undefined)
  }, [])

  const onFilterByPayee = useCallback(
    (payee?: string) => setFilter({ search: payee }),
    []
  )

  const resultFilter = useMemo(() => {
    if (preFilter) {
      return filter ? (['AND', preFilter, filter] as TrConditions) : preFilter
    }
    return filter
  }, [filter, preFilter])

  const debouncedFilter = useDebounce(resultFilter, 300)
  const trList = useFilteredTransactions(transactions, debouncedFilter)
  const debtId = accountModel.useDebtAccountId()

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
  const checkByChangedDate = useCallback(
    (date: Date | number) => {
      sendEvent('Transaction: select similar')
      const ids = trList.filter(tr => tr.changed === +date).map(tr => tr.id)
      setChecked(ids)
    },
    [trList]
  )
  const openContextMenu = useTrContextMenu(checkByChangedDate)

  useEffect(() => {
    if (checkedDate) checkByChangedDate(checkedDate)
  }, [checkByChangedDate, checkedDate])

  const groups = useMemo(() => {
    let groups: ByDate<{ date: TISODate; transactions: JSX.Element[] }> = {}
    trList.forEach(tr => {
      let Component = (
        <Transaction
          key={tr.id}
          id={tr.id}
          transaction={tr}
          type={trModel.getType(tr, debtId)}
          isOpened={tr.id === opened}
          isChecked={checked.includes(tr.id)}
          isInSelectionMode={!!checked.length}
          onOpen={onTrOpen}
          onToggle={toggleTransaction}
          onPayeeClick={onFilterByPayee}
          onContextMenu={openContextMenu(tr.id)}
        />
      )
      groups[tr.date] ??= { date: tr.date, transactions: [] }
      groups[tr.date].transactions.push(Component)
    })
    return Object.values(groups)
  }, [
    checked,
    debtId,
    opened,
    trList,
    onTrOpen,
    onFilterByPayee,
    openContextMenu,
    toggleTransaction,
  ])

  return (
    <>
      <Box
        display={'flex'}
        flexDirection={'column'}
        px={1}
        pt={1}
        position={'relative'}
        sx={sx}
      >
        {!hideFilter && (
          <Box
            position="relative"
            zIndex={10}
            maxWidth={560}
            width="100%"
            mx="auto"
          >
            <Filter
              conditions={filter}
              setCondition={setCondition}
              clearFilter={handleClearFilter}
            />
          </Box>
        )}

        <Actions
          visible={Boolean(checked?.length)}
          checkedIds={checked}
          onUncheckAll={uncheckAll}
          onCheckAll={checkAll}
        />

        <Box flex="1 1 auto">
          {groups.length ? (
            <GrouppedList {...{ groups, initialDate }} />
          ) : (
            <EmptyState />
          )}
        </Box>
      </Box>

      <TransactionMenu />
    </>
  )
}

function useFilteredTransactions(
  transactions?: TTransaction[],
  conditions?: TrConditions
) {
  const allTransactions = trModel.useSortedTransactions()
  const groups = useMemo(() => {
    const checker = trModel.checkRaw(conditions)
    const list = transactions || allTransactions
    return list.filter(checker).sort(trModel.compareTrDates)
  }, [transactions, allTransactions, conditions])
  return groups
}

const EmptyState = () => (
  <Box p={5}>
    <Typography variant="body1" align="center" paragraph>
      Таких операций нет.
      <br />
      Возможно, дело в фильтрах.
    </Typography>
  </Box>
)

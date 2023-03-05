import React, { useMemo, useState, useCallback, useEffect, FC } from 'react'
import { Box, Typography } from '@mui/material'
import { SxProps } from '@mui/system'
import { Theme } from '@mui/material/styles'
import { FilterConditions, trModel } from '@entities/transaction'
import { GrouppedList } from './GrouppedList'
import Filter from './TopBar/Filter'
import Actions from './TopBar/Actions'
import { sendEvent } from '@shared/helpers/tracking'
import { useDebounce } from '@shared/hooks/useDebounce'
import {
  ByDate,
  TDateDraft,
  TISODate,
  TTransaction,
  TTransactionId,
} from '@shared/types'
import { Transaction } from './Transaction'
import { accountModel } from '@entities/account'
import { TransactionMenu, useTrContextMenu } from './ContextMenu'

export type TTransactionListProps = {
  onTrOpen?: (id: TTransactionId) => void
  transactions?: TTransaction[]
  filterConditions?: FilterConditions
  hideFilter?: boolean
  checkedDate?: Date | null
  initialDate?: TDateDraft
  sx?: SxProps<Theme>
}

export const TransactionList: FC<TTransactionListProps> = props => {
  const {
    onTrOpen,
    transactions,
    filterConditions,
    hideFilter = false,
    checkedDate,
    initialDate,
    sx,
  } = props

  const [filter, setFilter] = useState(filterConditions)
  const debouncedFilter = useDebounce(filter, 300)
  const setCondition = useCallback(
    (condition?: FilterConditions) =>
      setFilter(filter => ({ ...filter, ...condition })),
    []
  )
  const handleClearFilter = useCallback(() => {
    setFilter(filterConditions)
  }, [filterConditions])

  const onFilterByPayee = useCallback(
    (payee?: string) => setFilter({ search: payee }),
    []
  )

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
          isOpened={false}
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
    onFilterByPayee,
    onTrOpen,
    openContextMenu,
    toggleTransaction,
    trList,
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
  conditions?: FilterConditions
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

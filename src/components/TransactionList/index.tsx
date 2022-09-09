import React, { useMemo, useState, useCallback, useEffect, FC } from 'react'
import { Box } from '@mui/material'
import { SxProps } from '@mui/system'
import { Theme } from '@mui/material/styles'
import { useAppSelector } from '@store'
import {
  getSortedTransactions,
  compareTrDates,
  groupTransactionsBy,
  checkRaw,
  FilterConditions,
} from '@entities/transaction'
import { GrouppedList } from './GrouppedList'
import Filter from './TopBar/Filter'
import Actions from './TopBar/Actions'
import { sendEvent } from '@shared/helpers/tracking'
// import { getGroupedTransactions } from '@worker'
import { useDebounce } from '@shared/hooks/useDebounce'
import { TTransaction, TTransactionId } from '@shared/types'

export type TTransactionListProps = {
  transactions?: TTransaction[]
  prefilter?: FilterConditions | FilterConditions[]
  filterConditions?: FilterConditions
  hideFilter?: boolean
  checkedDate?: Date | null
  sx?: SxProps<Theme>
}

export const TransactionList: FC<TTransactionListProps> = props => {
  const {
    transactions,
    prefilter,
    filterConditions,
    hideFilter = false,
    checkedDate,
    sx,
  } = props

  const allTransactions = useAppSelector(getSortedTransactions)
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
  const trList = transactions?.sort(compareTrDates) || allTransactions

  const groups = useMemo(() => {
    if (prefilter) {
      return groupTransactionsBy(
        'DAY',
        trList.filter(checkRaw(prefilter)),
        debouncedFilter
      )
    }
    return groupTransactionsBy('DAY', trList, debouncedFilter)
  }, [trList, debouncedFilter, prefilter])

  // const [groups, setGroups] = useState([])
  // useEffect(() => {
  //   async function updateTransactions() {
  //     const t0 = performance.now()
  //     const gr = await getGroupedTransactions(
  //       'DAY',
  //       null, //prefilter ? transactions.filter(checkRaw(prefilter)) : transactions,
  //       debouncedFilter
  //     )
  //     console.log('GET groupped ', +(performance.now() - t0).toFixed(2))
  //     setGroups(gr)
  //   }
  //   updateTransactions()
  // }, [transactions, debouncedFilter, prefilter])

  const [checked, setChecked] = useState<string[]>([])

  const uncheckAll = useCallback(() => setChecked([]), [])

  const checkAll = () => {
    let ids: string[] = []
    Object.values(groups).forEach(day => {
      ids = ids.concat(day.transactions)
    })
    setChecked(ids)
  }

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
      const ids = allTransactions
        .filter(tr => tr.changed === +date)
        .map(tr => tr.id)
      setChecked(ids)
    },
    [allTransactions]
  )

  useEffect(() => {
    if (checkedDate) checkByChangedDate(checkedDate)
  }, [checkByChangedDate, checkedDate])

  const showActions = Boolean(checked?.length)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        px: 1,
        pt: 1,
        position: 'relative',
        ...sx,
      }}
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
        visible={showActions}
        checkedIds={checked}
        onUncheckAll={uncheckAll}
        onCheckAll={checkAll}
      />

      <Box flex="1 1 auto">
        <GrouppedList
          {...{
            groups,
            checked,
            toggleTransaction,
            checkByChangedDate,
            onFilterByPayee,
          }}
        />
      </Box>
    </Box>
  )
}

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { Box } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { getSortedTransactions } from 'store/localData/transactions'
import {
  checkRaw,
  groupTransactionsBy,
} from 'store/localData/transactions/helpers'
import { GrouppedList } from './GrouppedList'
import Filter from './TopBar/Filter'
import Actions from './TopBar/Actions'
import { sendEvent } from 'helpers/tracking'
import { getGroupedTransactions } from 'worker'

export default function TransactionList(props) {
  const {
    prefilter,
    filterConditions,
    hideFilter = false,
    opened,
    checkedDate,
    setOpened,
    ...rest
  } = props

  const transactions = useSelector(getSortedTransactions)
  const [filter, setFilter] = useState(filterConditions)
  const setCondition = condition => setFilter({ ...filter, ...condition })
  const onFilterByPayee = payee => setFilter({ search: payee })

  // const groups = useMemo(() => {
  //   if (prefilter) {
  //     return groupTransactionsBy(
  //       'DAY',
  //       transactions.filter(checkRaw(prefilter)),
  //       filter
  //     )
  //   }
  //   return groupTransactionsBy('DAY', transactions, filter)
  // }, [transactions, filter, prefilter])

  const [groups, setGroups] = useState([])
  useEffect(() => {
    async function updateTransactions() {
      const gr = await getGroupedTransactions(
        'DAY',
        transactions,
        filter,
        Date.now()
      )
      console.log('upd', gr.length)
      setGroups(gr)
    }
    updateTransactions()
  }, [transactions, filter])

  const [checked, setChecked] = useState([])

  const uncheckAll = useCallback(() => setChecked([]), [setChecked])

  const toggleTransaction = useCallback(
    id =>
      checked.includes(id)
        ? setChecked(checked.filter(checked => id !== checked))
        : setChecked([...checked, id]),
    [checked]
  )

  const checkByChangedDate = useCallback(
    date => {
      sendEvent('Transaction: select similar')
      const ids = transactions
        .filter(tr => tr.changed === +date)
        .map(tr => tr.id)
      setChecked(ids)
    },
    [transactions]
  )

  useEffect(() => {
    if (checkedDate) checkByChangedDate(checkedDate)
  }, [checkByChangedDate, checkedDate])

  const showActions = Boolean(checked?.length)

  return (
    <Box
      display="flex"
      flexDirection="column"
      px={1}
      pt={1}
      position="relative"
      {...rest}
    >
      {!hideFilter && (
        <Box
          position="relative"
          zIndex={10}
          maxWidth={560}
          width="100%"
          mx="auto"
        >
          <Filter conditions={filter} setCondition={setCondition} />
        </Box>
      )}

      <Actions
        visible={showActions}
        checkedIds={checked}
        onUncheckAll={uncheckAll}
      />

      <Box flex="1 1 auto">
        <GrouppedList
          {...{
            groups,
            opened,
            setOpened,
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

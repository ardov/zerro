import React, { useMemo, useState, useCallback } from 'react'
import { Box } from '@material-ui/core'
import { connect } from 'react-redux'
import { getSortedTransactions } from 'store/localData/transactions'
import { groupTransactionsBy } from 'store/localData/transactions/helpers'
import { GrouppedList } from './GrouppedList'
import Filter from './TopBar/Filter'
import Actions from './TopBar/Actions'
import sendEvent from 'helpers/sendEvent'

export function TransactionList({
  transactions = [],
  filterConditions = {},
  hideFilter = false,
  opened,
  setOpened,
  ...rest
}) {
  const [filter, setFilter] = useState(filterConditions)
  const setCondition = condition => setFilter({ ...filter, ...condition })

  const groups = useMemo(
    () => groupTransactionsBy('DAY', transactions, filter),
    [transactions, filter]
  )

  // TODO: позволить контроллировать значения извне чтобы выбирать
  //       операции изменённые в то же время
  const [checked, setChecked] = useState([])
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

  return (
    <Box display="flex" flexDirection="column" p={1} {...rest}>
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
      {!!checked.length && (
        <Box p={2}>
          <Actions checkedIds={checked} onUncheckAll={() => setChecked([])} />
        </Box>
      )}

      <Box flex="1 1 auto">
        <GrouppedList
          {...{
            groups,
            opened,
            setOpened,
            checked,
            toggleTransaction,
            checkByChangedDate,
          }}
        />
      </Box>
    </Box>
  )
}

export default connect(
  state => ({ transactions: getSortedTransactions(state) }),
  () => ({})
)(TransactionList)

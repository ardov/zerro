import React, { useMemo, useState } from 'react'
import { Collapse, Box } from '@material-ui/core'
import { connect } from 'react-redux'
import { getSortedTransactions } from 'store/localData/transactions'
import { groupTransactionsBy } from 'store/localData/transactions/helpers'
import { GrouppedList } from './GrouppedList'
import Filter from './TopBar/Filter'
import Actions from './TopBar/Actions'

export function TransactionList({
  transactions = [],
  filterConditions = {},
  hideFilter = false,
  opened,
  setOpened,
  ...rest
}) {
  const [filter, setFilter] = useState(filterConditions)
  const groups = useMemo(
    () => groupTransactionsBy('DAY', transactions, filter),
    [transactions, filter]
  )
  const setCondition = condition => setFilter({ ...filter, ...condition })

  const [checked, setChecked] = useState([])
  const toggleTransaction = id =>
    checked.includes(id)
      ? setChecked(checked.filter(checked => id !== checked))
      : setChecked([...checked, id])

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
          {...{ groups, opened, setOpened, checked, toggleTransaction }}
        />
      </Box>
    </Box>
  )
}

export default connect(
  state => ({ transactions: getSortedTransactions(state) }),
  () => ({})
)(TransactionList)

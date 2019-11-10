import React, { useEffect, useRef, useMemo } from 'react'
import { Box } from '@material-ui/core'
import { VariableSizeList as List } from 'react-window'
// import { areEqual } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

import { connect } from 'react-redux'
import TransactionGroup from './TransactionGroup'
import TopBar from './TopBar'
import { getSortedTransactions } from 'store/data/transactions'
import formatDate from './formatDate'
import { checkRaw, getFilterConditions } from 'store/filterConditions'
import { groupTransactionsBy } from 'store/data/transactions/helpers'

const HEADER_HEIGHT = 48
const TRANSACTION_HEIGHT = 72

export function TransactionList({
  transactions,
  filterConditions,
  opened,
  setOpened,
  ...rest
}) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.resetAfterIndex(0)
  }, [listRef, transactions, filterConditions])

  const groups = useMemo(() => {
    const groupped = groupTransactionsBy(
      'DAY',
      transactions.filter(checkRaw(filterConditions))
    )
    return groupped.map(group => ({
      ...group,
      transactions: group.transactions.map(tr => tr.id),
    }))
  }, [transactions, filterConditions])

  const getItemKey = i => +groups[i].date

  const getItemSize = i =>
    HEADER_HEIGHT + TRANSACTION_HEIGHT * groups[i].transactions.length

  return (
    <Box display="flex" flexDirection="column" {...rest}>
      <TopBar />
      <Box flex="1 1 auto">
        <AutoSizer disableWidth>
          {({ height }) => (
            <List
              className="hidden-scroll"
              ref={listRef}
              height={height}
              itemCount={groups.length}
              itemSize={getItemSize}
              width="100%"
              itemKey={getItemKey}
              itemData={groups}
            >
              {({ index, style }) => (
                <TransactionGroup
                  style={style}
                  name={formatDate(groups[index].date)}
                  transactions={groups[index].transactions}
                  {...{ opened, setOpened }}
                />
              )}
            </List>
          )}
        </AutoSizer>
      </Box>
    </Box>
  )
}

export default connect(
  state => ({
    transactions: getSortedTransactions(state),
    filterConditions: getFilterConditions(state),
  }),
  () => ({})
)(TransactionList)

const findDateIndex = (groups, date) => {
  // groups.forEach((group, index) => {})
  return 5
}

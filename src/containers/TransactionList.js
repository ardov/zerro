import React, { memo } from 'react'
import styled from 'styled-components'
import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { VariableSizeList as List } from 'react-window'
import { areEqual } from 'react-window'
// import AutoSizer from 'react-virtualized-auto-sizer'

import { connect } from 'react-redux'
import TransactionGroup from '../components/TransactionGroup'
import { getGrouppedByDay } from '../store/data/selectors/transaction'

function formatDate(date) {
  const formats = {
    today: 'Сегодня, D MMMM, dd',
    yesterday: 'Вчера, D MMMM, dd',
    thisYear: 'D MMMM, dd',
    previousYear: 'D MMMM YYYY, dd'
  }
  const formatString = isToday(date)
    ? formats.today
    : isYesterday(date)
    ? formats.yesterday
    : isThisYear(date)
    ? formats.thisYear
    : formats.previousYear

  return format(date, formatString, { locale: ru })
}

function TransactionList(props) {
  const { groupped } = props
  const GROUP_HEADER_HEIGHT = 40
  const TRANSACTION_HEIGHT = 77
  const BORDER_HEIGHT = 1

  const getItemSize = i =>
    GROUP_HEADER_HEIGHT +
    TRANSACTION_HEIGHT * groupped[i].transactions.length +
    BORDER_HEIGHT

  const Row = memo(
    ({ index, style }) => (
      <TransactionGroup
        style={style}
        key={+groupped[index].date}
        name={formatDate(groupped[index].date)}
        transactions={groupped[index].transactions}
      />
    ),
    areEqual
  )

  const hasData = !!groupped.length

  return (
    // <AutoSizer>
    //   {({ height, width }) => (
    <List
      height={window.innerHeight - 40}
      itemCount={groupped.length}
      itemSize={getItemSize}
      width={'100%'}
    >
      {Row}
    </List>
    //   )}
    // </AutoSizer>
  )
}

export default connect(
  state => ({ groupped: getGrouppedByDay(state) }),
  null
)(TransactionList)

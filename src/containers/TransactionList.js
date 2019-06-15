import React, { memo } from 'react'
import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { VariableSizeList as List } from 'react-window'
import { areEqual } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

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

class TransactionList extends React.Component {
  state = { listRef: {} }

  componentDidUpdate = (_, prevState) => {
    if (prevState.listRef.resetAfterIndex) prevState.listRef.resetAfterIndex(0)
  }

  setRef = r => this.setState({ listRef: r })

  getItemKey = i =>
    +this.props.groupped[i].date +
    '-' +
    this.props.groupped[i].transactions.length

  getItemSize = (i, d) => {
    const GROUP_HEADER_HEIGHT = 40
    const TRANSACTION_HEIGHT = 77
    const BORDER_HEIGHT = 1
    return (
      GROUP_HEADER_HEIGHT +
      TRANSACTION_HEIGHT * this.props.groupped[i].transactions.length +
      BORDER_HEIGHT
    )
  }

  render() {
    const { groupped } = this.props

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

    return (
      <AutoSizer disableWidth={true}>
        {({ height, width }) => (
          <List
            ref={this.setRef}
            height={height}
            itemCount={groupped.length}
            itemSize={this.getItemSize}
            width={'100%'}
            itemKey={this.getItemKey}
            itemData={groupped}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    )
  }
}

export default connect(
  state => ({ groupped: getGrouppedByDay(state) }),
  null
)(TransactionList)

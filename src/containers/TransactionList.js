import React from 'react'
import styled from 'styled-components'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'

import { Spin } from 'antd'
import { connect } from 'react-redux'
import TransactionGroup from '../components/TransactionGroup'
import { getGrouppedByDay } from '../store/data/selectors/transaction'

const SpinContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
`

function formatDate(date) {
  const isCurrentYear = new Date().getFullYear() === date.getFullYear()
  const formatString = isCurrentYear ? 'D MMMM, dd' : 'D MMMM YYYY, dd'
  return format(date, formatString, { locale: ru })
}

function TransactionList(props) {
  const { groupped } = props
  const sliced = groupped.splice(0, 3)

  const hasData = !!groupped.length

  return (
    <div>
      {hasData &&
        sliced.map(({ date, transactions }) => (
          <TransactionGroup
            key={+date}
            name={formatDate(date)}
            transactions={transactions}
          />
        ))}
      {!groupped.length && (
        <SpinContainer>
          <Spin />
        </SpinContainer>
      )}
    </div>
  )
}

export default connect(
  (state, ownProps) => ({ groupped: getGrouppedByDay(state) }),
  null
)(TransactionList)

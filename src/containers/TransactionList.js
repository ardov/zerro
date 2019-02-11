import React from 'react'
import styled from 'styled-components'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import {
  groupTransactionsBy,
  groupTransactionsAndReturnId
} from '../Utils/transactions'
import { Spin } from 'antd'
import { connect } from 'react-redux'
import { getTransactions, getGrouppedIds } from '../store/selectors'

import Transaction from './Transaction'
import TransactionGroup from '../components/TransactionGroup'

const Group = styled.section`
  padding-top: 20px;
  position: relative;

  &:first-child {
    padding-top: 0;
  }
`
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
  console.log('RENDER LIST')

  // const groupped = groupTransactionsAndReturnId('day', transactions)
  const hasData = !!groupped.length

  return (
    <div>
      {hasData &&
        groupped.map(({ date, transactions }) => (
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

const lim = { limit: 4 }

const mapStateToProps = (state, ownProps) => ({
  // transactions: getTransactions(state)({ limit: ownProps.limit }),
  groupped: getGrouppedIds(state, lim)
})

export default connect(
  mapStateToProps,
  null
)(TransactionList)

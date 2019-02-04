import React from 'react'
import styled from 'styled-components'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { groupTransactionsBy } from '../Utils/transactions'
import { Spin } from 'antd'
import { connect } from 'react-redux'
import { getTransactions } from '../store/selectors'

import Transaction from './Transaction'

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

function DateTitle({ date }) {
  const Title = styled.h3`
    margin: 0;
    padding: 8px 0;
    position: sticky;
    top: 0;
    background-color: #fff;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.56);
  `
  const isCurrentYear = new Date().getFullYear() === date.getFullYear()
  const formatString = isCurrentYear ? 'D MMMM, dd' : 'D MMMM YYYY, dd'
  const formattedDate = format(date, formatString, { locale: ru })
  return <Title>{formattedDate}</Title>
}

function TransactionList(props) {
  const { transactions } = props
  const groupped = groupTransactionsBy('day', transactions)
  const hasData = !!groupped.length

  return (
    <div>
      {hasData &&
        groupped.map(({ date, transactions }) => (
          <Group key={+date}>
            <DateTitle date={date} />
            <div>
              {transactions.map(tr => (
                <Transaction key={tr.id} id={tr.id} />
              ))}
            </div>
          </Group>
        ))}
      {!groupped.length && (
        <SpinContainer>
          <Spin />
        </SpinContainer>
      )}
    </div>
  )
}

const mapStateToProps = (state, ownProps) => ({
  transactions: getTransactions(state)({ limit: ownProps.limit })
})

export default connect(
  mapStateToProps,
  null
)(TransactionList)

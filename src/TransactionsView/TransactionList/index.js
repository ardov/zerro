import React, { Component } from 'react'
import styled from 'styled-components'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { groupTransactionsBy } from '../../Utils/transactions'
import { Spin } from 'antd'

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

export default class TransactionList extends Component {
  handleTransactionClick = id => {
    this.props.onTransactionOpen(id)
  }
  handleFilterByPayee = payee => {
    this.props.onSetFilter({ search: payee })
  }

  render() {
    const { opened, transactions } = this.props
    const groupped = groupTransactionsBy('day', transactions)
    const hasData = !!groupped.length
    const openedId = opened ? opened.id : null

    return (
      <div>
        {hasData &&
          groupped.map(({ date, transactions }) => (
            <Group key={+date}>
              <DateTitle date={date} />
              {transactions.map(tr => (
                <Transaction
                  data={tr}
                  key={tr.id}
                  opened={openedId === tr.id}
                  onClick={() => {
                    this.handleTransactionClick(tr.id)
                  }}
                  onFilterByPayee={() => {
                    this.handleFilterByPayee(tr.payee)
                  }}
                />
              ))}
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
}

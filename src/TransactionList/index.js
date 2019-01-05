import React, { Component } from 'react'
import styled from 'styled-components'

import Transaction from './Transaction'

function groupByDates(arr) {
  if (!arr) return []

  const reducer = (groupped, tr) => {
    let lastDate = groupped.length ? groupped[groupped.length - 1].date : null
    if (+lastDate === +tr.date) {
      groupped[groupped.length - 1].transactions.push(tr)
    } else {
      groupped.push({ date: tr.date, transactions: [tr] })
    }
    return groupped
  }

  return arr.reduce(reducer, [])
}

const Group = styled.section`
  position: relative;
`

const Title = styled.h3`
  margin: 0;
  padding: 0;
  position: sticky;
  top: 0;
`
export default class TransactionList extends Component {
  state = {}

  render() {
    const { opened, transactions } = this.props
    const groupped = groupByDates(transactions)

    return (
      <div>
        {groupped.length &&
          groupped.map(({ date, transactions }) => (
            <Group key={+date}>
              <Title>{date.toLocaleString()}</Title>
              {transactions.map(tr => (
                <Transaction data={tr} key={tr.id} />
              ))}
            </Group>
          ))}
      </div>
    )
  }
}

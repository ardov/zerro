import React, { Component } from 'react'
import styled from 'styled-components'

import { StoreContext } from '../Store/'

import Header from '../Header'
import TagList from './TagList'

export default class TransactionsView extends Component {
  static contextType = StoreContext

  render() {
    const { getTags, getTransactions } = this.context.actions
    const transactions = getTransactions({ limit: 1000 })
    const tags = getTags()

    return (
      <div>
        <Header />
        <TagList transactions={transactions} tags={tags} />
      </div>
    )
  }
}

import React, { Component } from 'react'
// import styled from 'styled-components'

import { StoreContext } from '../store'

import Header from '../Header'
import TagList from './TagList'

export default class TransactionsView extends Component {
  static contextType = StoreContext

  render() {
    const { getTags, getTransactions } = this.context.selectors
    const transactions = getTransactions()
    const tags = getTags()

    return (
      <div>
        <Header />
        <TagList transactions={transactions} tags={tags} />
      </div>
    )
  }
}

import React from 'react'
import { connect } from 'react-redux'

import Header from 'containers/Header'
import TagList from './TagList'
import { getTagsTree } from 'store/data/selectors/tags'
import { getTransactionList } from 'store/data/selectors/transaction'

function TransactionsView(props) {
  return (
    <div>
      <Header />
      <TagList transactions={props.transactions} tags={props.tags} />
    </div>
  )
}

const mapStateToProps = state => ({
  transactions: getTransactionList(state),
  tags: getTagsTree(state)
})

export default connect(
  mapStateToProps,
  null
)(TransactionsView)

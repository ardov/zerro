import React from 'react'
import { connect } from 'react-redux'

import Header from '../containers/Header'
import TagList from './TagList'
import { getTransactions } from '../store/selectors'
import { getTagsTree } from '../store/data/selectors/tags'

function TransactionsView(props) {
  return (
    <div>
      <Header />
      <TagList transactions={props.transactions} tags={props.tags} />
    </div>
  )
}

const mapStateToProps = state => ({
  transactions: getTransactions(state),
  tags: getTagsTree(state)
})

export default connect(
  mapStateToProps,
  null
)(TransactionsView)

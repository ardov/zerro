import React from 'react'
import { connect } from 'react-redux'

import Header from '../containers/Header'
import TagList from './TagList'
import { getTags, getTransactions } from '../store/selectors'

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
  tags: getTags(state)
})

export default connect(
  mapStateToProps,
  null
)(TransactionsView)

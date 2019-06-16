import React from 'react'
import { connect } from 'react-redux'

import Header from 'containers/Header'
import { getAllBudgets } from 'store/data/selectors/budgetView'

function Budgets(props) {
  console.log(props.budgets)

  return (
    <div>
      <Header />
    </div>
  )
}

const mapStateToProps = (state, props) => ({
  budgets: getAllBudgets(state)
})

export default connect(
  mapStateToProps,
  null
)(Budgets)

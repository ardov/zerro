import { connect } from 'react-redux'

import { openTransaction } from '../store/openedTransaction/actions'
import Transaction from '../components/Transaction'
import { setCondition } from '../store/filterConditions/actions'
import { makeGetTransaction } from '../store/data/selectors'

const makeMapStateToProps = () => {
  const getTransaction = makeGetTransaction()
  const mapStateToProps = (state, props) => ({
    ...getTransaction(state, props.id)
  })
  return mapStateToProps
}

const mapDispatchToProps = dispatch => ({
  onClick: id => dispatch(openTransaction(id)),
  onFilterByPayee: payee => dispatch(setCondition({ search: payee }))
})

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(Transaction)

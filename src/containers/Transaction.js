import { connect } from 'react-redux'

import { openTransaction, getOpenedId } from '../store/openedTransaction'
import Transaction from '../components/Transaction'
import { setCondition } from '../store/filterConditions'
import { getTransaction } from '../store/data/selectors/transaction'

const mapStateToProps = (state, props) => {
  return {
    isSelected: props.id === getOpenedId(state),
    ...getTransaction(state, props.id)
  }
}

const mapDispatchToProps = dispatch => ({
  onClick: id => dispatch(openTransaction(id)),
  onFilterByPayee: payee => dispatch(setCondition({ search: payee }))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Transaction)

import { connect } from 'react-redux'
import { getElement } from '../store/selectors'
import { openTransaction } from '../store/openedTransaction/actions'
import Transaction from '../components/Transaction'
import { setCondition } from '../store/filterConditions/actions'

const mapStateToProps = (state, ownProps) => ({
  tr: getElement(state)('transaction', ownProps.id)
})

const mapDispatchToProps = dispatch => ({
  onClick: id => dispatch(openTransaction(id)),
  onFilterByPayee: payee => dispatch(setCondition({ search: payee }))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Transaction)

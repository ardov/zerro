import { connect } from 'react-redux'
import { setCondition } from '../store/actions/filter'
import { getElement } from '../store/selectors'
import { openTransaction } from '../store/actions'
import Transaction from '../components/Transaction'

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

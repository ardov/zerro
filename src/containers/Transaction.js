import { connect } from 'react-redux'

import { openTransaction, getOpenedId } from '../store/openedTransaction'
import Transaction from '../components/Transaction'
import { setCondition } from '../store/filterConditions'
import { getTransaction } from '../store/data/selectors/transaction'
import { getSelectedIds } from '../store/selectedTransactions'

const mapStateToProps = (state, props) => ({
  isOpened: props.id === getOpenedId(state),
  isChecked: getSelectedIds(state).includes(props.id),
  isInSelectionMode: !!getSelectedIds(state).length,
  ...getTransaction(state, props.id)
})

const mapDispatchToProps = dispatch => ({
  onClick: id => dispatch(openTransaction(id)),
  onFilterByPayee: payee => dispatch(setCondition({ search: payee }))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Transaction)

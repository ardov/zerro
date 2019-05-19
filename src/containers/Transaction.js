import { connect } from 'react-redux'

import { openTransaction, getOpenedId } from '../store/openedTransaction'
import Transaction from '../components/Transaction'
import { setCondition } from '../store/filterConditions'
import { getTransaction } from '../store/data/selectors/transaction'
import {
  getSelectedIds,
  toggleTransaction
} from '../store/selectedTransactions'

const mapStateToProps = (state, props) => ({
  isOpened: props.id === getOpenedId(state),
  isChecked: getSelectedIds(state).includes(props.id),
  isInSelectionMode: !!getSelectedIds(state).length,
  ...getTransaction(state, props.id)
})

const mapDispatchToProps = (dispatch, props) => ({
  onClick: () => dispatch(openTransaction(props.id)),
  onToggle: () => dispatch(toggleTransaction(props.id)),
  onFilterByPayee: payee => dispatch(setCondition({ search: payee }))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Transaction)

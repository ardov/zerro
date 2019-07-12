import { connect } from 'react-redux'
import { getOpenedTransaction } from 'store/data/transaction'
import {
  deleteTransactions,
  restoreTransaction,
  applyChangesToTransaction,
  splitTransfer,
} from 'store/data/transaction/thunks'
import DetailsPanel from 'components/DetailsPanel'

const mapStateToProps = (state, ownProps) => ({
  transaction: getOpenedTransaction(state),
})

const mapDispatchToProps = dispatch => ({
  onDelete: id => dispatch(deleteTransactions([id])),
  onRestore: id => dispatch(restoreTransaction(id)),
  onSplit: id => dispatch(splitTransfer(id)),
  onSave: tr => {
    dispatch(applyChangesToTransaction({ id: tr.id, tag: tr.tag }))
  },
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DetailsPanel)

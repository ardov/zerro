import { connect } from 'react-redux'
import { getOpened } from '../store/selectors'
import {
  deleteTransaction,
  restoreTransaction,
  applyChangesToTransaction
} from '../store/data/thunks'
import DetailsPanel from '../components/DetailsPanel'

const mapStateToProps = (state, ownProps) => ({
  transaction: getOpened(state)()
})

const mapDispatchToProps = dispatch => ({
  onDelete: id => dispatch(deleteTransaction(id)),
  onRestore: id => dispatch(restoreTransaction(id)),
  onSave: tr => {
    dispatch(applyChangesToTransaction({ id: tr.id, tag: tr.tag }))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DetailsPanel)

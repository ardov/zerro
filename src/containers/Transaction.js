import { connect } from 'react-redux'
import {
  getElement,
  getTransaction,
  makeGetTransaction
} from '../store/selectors'
import { openTransaction } from '../store/openedTransaction/actions'
import Transaction from '../components/Transaction'
import { setCondition } from '../store/filterConditions/actions'

const makeMapStateToProps = () => {
  const getTransaction = makeGetTransaction()
  const mapStateToProps = (state, props) => {
    return {
      ...getTransaction(state, props.id)
    }
  }
  return mapStateToProps
}

// const mapStateToProps = (state, ownProps) => ({
//   // ...getElement(state)('transaction', ownProps.id)
//   ...getTransaction(state, ownProps.id)
// })

const mapDispatchToProps = dispatch => ({
  onClick: id => dispatch(openTransaction(id)),
  onFilterByPayee: payee => dispatch(setCondition({ search: payee }))
})

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(Transaction)

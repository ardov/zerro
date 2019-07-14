import { connect } from 'react-redux'

import { openTransaction, getOpenedId } from 'store/openedTransaction'
import { setCondition } from 'store/filterConditions'
import { getSelectedIds, toggleTransaction } from 'store/selectedTransactions'
import { getInstrument } from 'store/data/instruments'
import { getAccount } from 'store/data/accounts'
import { getTag } from 'store/data/tags'

import Transaction from './TransactionPreview'
import { getTransaction } from 'store/data/transactions'

const mapStateToProps = (state, props) => {
  const tr = getTransaction(state, props.id)
  return {
    ...tr,
    incomeInstrument: getInstrument(state, tr.incomeInstrument),
    incomeAccount: getAccount(state, tr.incomeAccount),
    opIncomeInstrument: getInstrument(state, tr.opIncomeInstrument),
    outcomeInstrument: getInstrument(state, tr.outcomeInstrument),
    outcomeAccount: getAccount(state, tr.outcomeAccount),
    opOutcomeInstrument: getInstrument(state, tr.opOutcomeInstrument),
    type:
      tr.income && tr.outcome ? 'transfer' : tr.income ? 'income' : 'outcome',

    tag: tr.tag && tr.tag.length ? tr.tag.map(id => getTag(state, id)) : null,
    isOpened: props.id === getOpenedId(state),
    isChecked: getSelectedIds(state).includes(props.id),
    isInSelectionMode: !!getSelectedIds(state).length,
  }
}

const mapDispatchToProps = (dispatch, props) => ({
  onClick: () => dispatch(openTransaction(props.id)),
  onToggle: () => dispatch(toggleTransaction(props.id)),
  onFilterByPayee: payee => dispatch(setCondition({ search: payee })),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Transaction)

import { connect } from 'react-redux'
import parseDate from 'date-fns/parse'

import { openTransaction, getOpenedId } from 'store/openedTransaction'
import Transaction from './TransactionPreview'
import { setCondition } from 'store/filterConditions'
import { getTransaction } from 'store/data/selectors/transaction'
import { getSelectedIds, toggleTransaction } from 'store/selectedTransactions'
import { getInstrument } from 'store/data/instrument'

const mapStateToProps = (state, props) => {
  const tr = state.data.transaction[props.id]
  return {
    ...tr,
    date: +parseDate(tr.date),
    incomeInstrument: getInstrument(state, tr.incomeInstrument),
    incomeAccount: state.data.account[tr.incomeAccount],
    opIncomeInstrument: getInstrument(state, tr.opIncomeInstrument),
    outcomeInstrument: getInstrument(state, tr.outcomeInstrument),
    outcomeAccount: state.data.account[tr.outcomeAccount],
    opOutcomeInstrument: getInstrument(state, tr.opOutcomeInstrument),
    type:
      tr.income && tr.outcome ? 'transfer' : tr.income ? 'income' : 'outcome',

    tag: tr.tag && tr.tag.length ? tr.tag.map(id => state.data.tag[id]) : null,
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

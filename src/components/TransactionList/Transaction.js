import { connect } from 'react-redux'
import parseDate from 'date-fns/parse'

import { openTransaction, getOpenedId } from 'store/openedTransaction'
import Transaction from './TransactionPreview'
import { setCondition } from 'store/filterConditions'
import { getTransaction } from 'store/data/selectors/transaction'
import { getSelectedIds, toggleTransaction } from 'store/selectedTransactions'

const mapStateToProps = (state, props) => {
  const tr = state.data.transaction[props.id]
  return {
    ...tr,
    date: +parseDate(tr.date),
    incomeInstrument: state.data.instrument[tr.incomeInstrument],
    incomeAccount: state.data.account[tr.incomeAccount],
    opIncomeInstrument: state.data.instrument[tr.opIncomeInstrument],
    outcomeInstrument: state.data.instrument[tr.outcomeInstrument],
    outcomeAccount: state.data.account[tr.outcomeAccount],
    opOutcomeInstrument: state.data.instrument[tr.opOutcomeInstrument],
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

import { connect } from 'react-redux'
import { setCondition } from 'store/filterConditions'
import {
  getSelectedIds,
  toggleTransaction,
  selectTransactionsByChangedDate,
} from 'store/selectedTransactions'
import { getInstrument } from 'store/data/instruments'
import { getAccount } from 'store/data/accounts'
import { getPopulatedTag } from 'store/data/tags'
import Transaction from './Transaction'
import { getTransaction } from 'store/data/transactions'
import { getType } from 'store/data/transactions/helpers'

const mapStateToProps = (state, { id }) => {
  const tr = getTransaction(state, id)

  const incomeInstrument = getInstrument(state, tr.incomeInstrument)
  const incomeAccount = getAccount(state, tr.incomeAccount)
  const opIncomeInstrument = getInstrument(state, tr.opIncomeInstrument)
  const outcomeInstrument = getInstrument(state, tr.outcomeInstrument)
  const outcomeAccount = getAccount(state, tr.outcomeAccount)
  const opOutcomeInstrument = getInstrument(state, tr.opOutcomeInstrument)

  return {
    id: tr.id,
    changed: tr.changed,
    qrCode: tr.qrCode,
    type: getType(tr),

    incomeAccountTitle: incomeAccount && incomeAccount.title,
    outcomeAccountTitle: outcomeAccount && outcomeAccount.title,
    deleted: tr.deleted,
    payee: tr.payee,
    comment: tr.comment,
    income: tr.income,
    incomeCurrency: incomeInstrument && incomeInstrument.shortTitle,
    opIncome: tr.opIncome,
    opIncomeCurrency: opIncomeInstrument && opIncomeInstrument.shortTitle,
    outcome: tr.outcome,
    outcomeCurrency: outcomeInstrument && outcomeInstrument.shortTitle,
    opOutcome: tr.opOutcome,
    opOutcomeCurrency: opOutcomeInstrument && opOutcomeInstrument.shortTitle,

    tag:
      tr.tag && tr.tag.length
        ? tr.tag.map(id => getPopulatedTag(state, id))
        : null,

    isChecked: getSelectedIds(state).includes(id),
    isInSelectionMode: !!getSelectedIds(state).length,
  }
}

const mapDispatchToProps = (dispatch, { id }) => ({
  onToggle: () => dispatch(toggleTransaction(id)),
  onSelectChanged: changed =>
    dispatch(selectTransactionsByChangedDate(changed)),
  onFilterByPayee: payee => dispatch(setCondition({ search: payee })),
})

export default connect(mapStateToProps, mapDispatchToProps)(Transaction)

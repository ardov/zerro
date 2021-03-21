import { connect } from 'react-redux'
import { getTransaction } from 'store/localData/transactions'
import {
  deleteTransactions,
  restoreTransaction,
  applyChangesToTransaction,
  // splitTransfer,
} from 'store/localData/transactions/thunks'
import Content from './Content'
import { getInstrument } from 'store/data/selectors'
import { getAccount } from 'store/localData/accounts'
import { getType } from 'store/localData/transactions/helpers'

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

    tag: tr.tag,

    ...tr,
  }
}

const mapDispatchToProps = (dispatch, { id }) => ({
  onChange: changes => dispatch(applyChangesToTransaction(changes)),
  onDelete: () => dispatch(deleteTransactions([id])),
  onRestore: () => dispatch(restoreTransaction(id)),
  // onSplit: id => dispatch(splitTransfer(id)), // does not work
})

export default connect(mapStateToProps, mapDispatchToProps)(Content)

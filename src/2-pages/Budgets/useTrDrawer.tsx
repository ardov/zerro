import { TISOMonth, TTransaction } from '6-shared/types'
import { envelopeModel, TEnvelopeId } from '5-entities/envelope'
import { balances, TrFilterMode } from '5-entities/envBalances'
import { store } from 'store/index'
import { useTransactionDrawer } from '3-widgets/global/TransactionListDrawer'

type TConditions = {
  id: TEnvelopeId | 'transferFees' | null
  month: TISOMonth
  mode?: TrFilterMode
  isExact?: boolean
}

// TODO: with this approach list of transactions stays the same even after edits

export function useTrDrawer() {
  const transactionDrawer = useTransactionDrawer()
  const open = (conditions: TConditions) => {
    const transactions = getFilteredTransactions(conditions)
    transactionDrawer.open({ transactions })
  }
  return open
}

function getFilteredTransactions(conditions: TConditions): TTransaction[] {
  const { id, month, mode = TrFilterMode.Envelope, isExact } = conditions
  const state = store.getState()
  const envelopes = envelopeModel.getEnvelopes(state)
  const activity = balances.activity(state)[month]
  const rawActivity = balances.rawActivity(state)[month]
  if (!activity || !rawActivity || !id) return []

  // Return transfer fees
  if (id === 'transferFees') return activity.transferFees.transactions

  // Prepare ids to get transactions
  const ids = id ? (isExact ? [id] : [id, ...envelopes[id].children]) : []

  // Prepare and merge transactions
  const transactions = ids
    .map(id => {
      if (mode === TrFilterMode.GeneralIncome)
        return activity?.generalIncome.byEnv[id]?.transactions || []
      if (mode === TrFilterMode.Envelope)
        return activity?.envActivity.byEnv[id]?.transactions || []
      if (mode === TrFilterMode.Income)
        return rawActivity?.income[id]?.transactions || []
      if (mode === TrFilterMode.Outcome)
        return rawActivity?.outcome[id]?.transactions || []
      // All
      return [
        ...(rawActivity?.income[id]?.transactions || []),
        ...(rawActivity?.outcome[id]?.transactions || []),
      ]
    })
    .reduce((acc, arr) => acc.concat(arr), [])
  return transactions
}

/*
NOTES

Which transaction filters do I need?

  - Envelope drawer

    - all transactions affecting envelope balance
      activity.envActivity.byEnv[id]

  - Incomes widget

    - if not keeping income => only general income
    activity.generalIncome.byEnv[id]

    - if keeping income => usual env transaction
    activity.envActivity.byEnv[id]

  - Outcomes widget

    - all transactions affecting envelope balance
      activity.envActivity.byEnv[id]

  - Transfers & debts widget

    - Envelope transactions + general income transactions
      activity.generalIncome.byEnv[id] + activity.envActivity.byEnv[id]

    - Transfer fees
      activity.transferFees

*/

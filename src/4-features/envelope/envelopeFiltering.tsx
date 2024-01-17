import { TISOMonth, TTransaction } from '6-shared/types'
import { envelopeModel, TEnvelopeId } from '5-entities/envelope'
import { balances, TrFilterMode } from '5-entities/envBalances'
import { useMemo } from 'react'

export type TEnvConditions = {
  month: TISOMonth
  id: TEnvelopeId | 'transferFees' | null
  isExact?: boolean
  mode?: TrFilterMode
}

export function useFilteredByEnvelope(
  conditions?: TEnvConditions
): TTransaction[] {
  const { id, month, mode = TrFilterMode.Envelope, isExact } = conditions || {}

  const envelopes = envelopeModel.useEnvelopes()
  const fullActivity = balances.useActivity()
  const fullRawActivity = balances.useRawActivity()

  const transactionList = useMemo(() => {
    if (!id || !month) return []
    const activity = fullActivity[month]
    const rawActivity = fullRawActivity[month]
    if (!activity || !rawActivity) return []

    // Return transfer fees
    if (id === 'transferFees') return activity.transferFees.transactions

    // Prepare ids to get transactions
    const ids = isExact ? [id] : [id, ...envelopes[id].children]

    // Prepare and merge transactions
    const transactions = ids
      .map(id => {
        switch (mode) {
          case TrFilterMode.GeneralIncome:
            return activity?.generalIncome.byEnv[id]?.transactions || []
          case TrFilterMode.Envelope:
            return activity?.envActivity.byEnv[id]?.transactions || []
          case TrFilterMode.Income:
            return rawActivity?.income[id]?.transactions || []
          case TrFilterMode.Outcome:
            return rawActivity?.outcome[id]?.transactions || []
          case TrFilterMode.All:
            return [
              ...(rawActivity?.income[id]?.transactions || []),
              ...(rawActivity?.outcome[id]?.transactions || []),
            ]
          default:
            throw new Error(`Unknown mode: ${mode}`)
        }
      })
      .reduce((acc, arr) => acc.concat(arr), [])
    return transactions
  }, [envelopes, fullActivity, fullRawActivity, id, isExact, mode, month])

  return transactionList
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

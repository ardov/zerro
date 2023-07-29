import React, { FC } from 'react'
import { TISOMonth, TTransaction } from '@shared/types'
import { TransactionsDrawer } from 'widgets/TransactionsDrawer'
import { envelopeModel, TEnvelopeId } from '@entities/envelope'
import { balances, TrFilterMode } from '@entities/envBalances'
import { makePopoverHooks } from '@shared/historyPopovers'
import { toISOMonth } from '@shared/helpers/date'
import { DrawerProps } from '@mui/material'

type TConditions = {
  id: TEnvelopeId | 'transferFees' | null
  month: TISOMonth
  mode?: TrFilterMode
  isExact?: boolean
}

const trDrawer = makePopoverHooks<TConditions, DrawerProps>(
  'budgetTransactionsDrawer',
  {
    id: null,
    month: toISOMonth(new Date()),
  }
)

export function useTrDrawer() {
  return trDrawer.useMethods().open
}

export const BudgetTransactionsDrawer: FC = () => {
  const drawer = trDrawer.useProps()
  const transactions = useFilteredTransactions(drawer.extraProps)
  if (!transactions) return null
  return (
    <TransactionsDrawer transactions={transactions} {...drawer.displayProps} />
  )
}

function useFilteredTransactions(conditions: TConditions): TTransaction[] {
  const { id, month, mode = TrFilterMode.Envelope, isExact } = conditions
  const envelopes = envelopeModel.useEnvelopes()
  const activity = balances.useActivity()[month]
  const rawActivity = balances.useRawActivity()[month]
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

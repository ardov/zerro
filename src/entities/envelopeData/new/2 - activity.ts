import { createSelector } from '@reduxjs/toolkit'
import { ByMonth, TEnvelopeId, TFxAmount, TTransaction } from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { addFxAmount } from '@shared/helpers/money'
import { withPerf } from '@shared/helpers/performance'
import { TSelector } from '@store/index'

import { getRawActivity, TRawActivityNode } from './1 - rawActivity'
import { getKeepingEnvelopes } from './1 - keepingEnvelopes'

export type TActivityNode = {
  total: TFxAmount
  transferFees: {
    total: TFxAmount
    transactions: TTransaction[]
  }
  generalIncome: {
    total: TFxAmount
    byEnv: {
      [id: TEnvelopeId]: {
        total: TFxAmount
        transactions: TTransaction[]
      }
    }
  }
  envActivity: {
    total: TFxAmount
    byEnv: {
      [id: TEnvelopeId]: {
        total: TFxAmount
        transactions: TTransaction[]
      }
    }
  }
}

export const getActivity: TSelector<ByMonth<TActivityNode>> = createSelector(
  [getRawActivity, getKeepingEnvelopes],
  withPerf('🖤 getActivity', calcActivity)
)

function calcActivity(
  activity: ByMonth<TRawActivityNode>,
  keepingEnvIds: TEnvelopeId[]
) {
  const res: ByMonth<TActivityNode> = {}

  keys(activity).forEach(month => {
    const node = makeEmptyNode()
    const { internal, income, outcome } = activity[month]

    if (internal.total && internal.transactions.length) {
      node.total = addFxAmount(node.total, internal.total)
      node.transferFees.total = internal.total
      node.transferFees.transactions = internal.transactions
    }

    keys(income).forEach(id => {
      const { total, transactions } = income[id]
      if (keepingEnvIds.includes(id)) {
        // Envelope keeps income -> all activity goes to envelope
        node.total = addFxAmount(node.total, total)
        node.envActivity.total = addFxAmount(node.envActivity.total, total)
        node.envActivity.byEnv[id] ??= { total: {}, transactions: [] }
        node.envActivity.byEnv[id].total = addFxAmount(
          node.envActivity.byEnv[id].total,
          total
        )
        node.envActivity.byEnv[id].transactions =
          node.envActivity.byEnv[id].transactions.concat(transactions)
      } else {
        // Activity goes to general income
        node.total = addFxAmount(node.total, total)
        node.generalIncome.total = addFxAmount(node.generalIncome.total, total)
        node.generalIncome.byEnv[id] ??= { total: {}, transactions: [] }
        node.generalIncome.byEnv[id].total = addFxAmount(
          node.generalIncome.byEnv[id].total,
          total
        )
        node.generalIncome.byEnv[id].transactions =
          node.generalIncome.byEnv[id].transactions.concat(transactions)
      }
    })
    keys(outcome).forEach(id => {
      const { total, transactions } = outcome[id]

      node.total = addFxAmount(node.total, total)
      node.envActivity.total = addFxAmount(node.envActivity.total, total)
      node.envActivity.byEnv[id] ??= { total: {}, transactions: [] }
      node.envActivity.byEnv[id].total = addFxAmount(
        node.envActivity.byEnv[id].total,
        total
      )
      node.envActivity.byEnv[id].transactions =
        node.envActivity.byEnv[id].transactions.concat(transactions)
    })

    res[month] = node
  })

  return res
}

function makeEmptyNode(): TActivityNode {
  return {
    total: {},
    transferFees: { total: {}, transactions: [] },
    generalIncome: { total: {}, byEnv: {} },
    envActivity: { total: {}, byEnv: {} },
  }
}

import { createSelector } from '@reduxjs/toolkit'
import { ByMonth, TFxAmount } from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { addFxAmount } from '@shared/helpers/money'
import { withPerf } from '@shared/helpers/performance'
import { TSelector } from '@store/index'

import {
  EnvActivity,
  getRawActivity,
  TRawActivityNode,
} from './1 - rawActivity'
import { envelopeModel, TEnvelopeId } from '@entities/envelope'

export type TActivityNode = {
  total: TFxAmount
  transferFees: EnvActivity
  generalIncome: {
    total: TFxAmount
    byEnv: Record<TEnvelopeId, EnvActivity>
  }
  envActivity: {
    total: TFxAmount
    byEnv: Record<TEnvelopeId, EnvActivity>
  }
}

export const getActivity: TSelector<ByMonth<TActivityNode>> = createSelector(
  [getRawActivity, envelopeModel.getKeepingEnvelopes],
  withPerf('🖤 getActivity', calcActivity)
)

function calcActivity(
  rawActivity: ByMonth<TRawActivityNode>,
  keepingEnvIds: TEnvelopeId[]
) {
  const res: ByMonth<TActivityNode> = {}

  keys(rawActivity).forEach(month => {
    const node = makeEmptyNode()
    const { internal, income, outcome } = rawActivity[month]

    node.total = addFxAmount(node.total, internal.total)
    node.transferFees = internal

    keys(income).forEach(id => {
      const activity = income[id]
      node.total = addFxAmount(node.total, activity.total)
      if (keepingEnvIds.includes(id)) {
        // Envelope keeps income -> all activity goes to envelope
        node.envActivity.total = addFxAmount(
          node.envActivity.total,
          activity.total
        )
        node.envActivity.byEnv[id] = activity
      } else {
        // Activity goes to general income
        node.generalIncome.total = addFxAmount(
          node.generalIncome.total,
          activity.total
        )
        node.generalIncome.byEnv[id] = activity
      }
    })

    keys(outcome).forEach(id => {
      const activity = outcome[id]
      node.total = addFxAmount(node.total, activity.total)
      node.envActivity.total = addFxAmount(
        node.envActivity.total,
        activity.total
      )
      node.envActivity.byEnv[id] = EnvActivity.merge(
        node.envActivity.byEnv[id],
        activity
      )
    })

    res[month] = node
  })

  return res
}

function makeEmptyNode(): TActivityNode {
  return {
    total: {},
    transferFees: new EnvActivity(),
    generalIncome: { total: {}, byEnv: {} },
    envActivity: { total: {}, byEnv: {} },
  }
}

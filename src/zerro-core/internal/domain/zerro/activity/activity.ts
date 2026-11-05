import { keys } from '../../foundation/keys'
import { addFxAmount } from '../../zenmoney/model/money'
import type { ByMonth } from '../../foundation/types'
import type { TFxAmount } from '../../zenmoney/model/money'
import type { TEnvelopeId } from '../envelope-id'
import type { TRawActivityNode } from './rawActivity'
import { EnvActivity } from './rawActivity'

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

export type TBuildActivityInput = {
  rawActivity: ByMonth<TRawActivityNode>
  keepingEnvelopeIds: ReadonlySet<TEnvelopeId>
}

export function buildActivity(
  input: TBuildActivityInput
): ByMonth<TActivityNode> {
  const result: ByMonth<TActivityNode> = {}

  keys(input.rawActivity).forEach(month => {
    const node = makeEmptyNode()
    const { internal, income, outcome } = input.rawActivity[month]

    node.total = addFxAmount(node.total, internal.total)
    node.transferFees = internal

    keys(income).forEach(envelopeId => {
      const activity = income[envelopeId]
      node.total = addFxAmount(node.total, activity.total)

      if (input.keepingEnvelopeIds.has(envelopeId)) {
        node.envActivity.total = addFxAmount(
          node.envActivity.total,
          activity.total
        )
        node.envActivity.byEnv[envelopeId] = activity
        return
      }

      node.generalIncome.total = addFxAmount(
        node.generalIncome.total,
        activity.total
      )
      node.generalIncome.byEnv[envelopeId] = activity
    })

    keys(outcome).forEach(envelopeId => {
      const activity = outcome[envelopeId]
      node.total = addFxAmount(node.total, activity.total)
      node.envActivity.total = addFxAmount(
        node.envActivity.total,
        activity.total
      )
      node.envActivity.byEnv[envelopeId] = EnvActivity.merge(
        node.envActivity.byEnv[envelopeId],
        activity
      )
    })

    result[month] = node
  })

  return result
}

function makeEmptyNode(): TActivityNode {
  return {
    total: {},
    transferFees: new EnvActivity(),
    generalIncome: { total: {}, byEnv: {} },
    envActivity: { total: {}, byEnv: {} },
  }
}

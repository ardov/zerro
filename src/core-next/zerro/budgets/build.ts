import { toISOMonth } from '6-shared/helpers/date'
import { keys } from '6-shared/helpers/keys'
import type { ById, ByMonth, TBudget } from '6-shared/types'
import { EnvType, envId, TEnvelopeId } from '../envelope-id'
import type { TBudgets } from './read'

export type TBuildBudgetsInput = {
  tagBudgets: ById<TBudget>
  envBudgets: ByMonth<TBudgets>
  preferZmBudgets: boolean
}

export function buildBudgets(input: TBuildBudgetsInput): ByMonth<TBudgets> {
  const result: ByMonth<TBudgets> = {}

  if (input.preferZmBudgets) {
    keys(input.tagBudgets).forEach(budgetId => {
      const budget = input.tagBudgets[budgetId]
      if (!budget.outcome) return

      const month = toISOMonth(budget.date)
      const envelopeId = envId.get(EnvType.Tag, String(budget.tag))
      result[month] ??= {}
      result[month][envelopeId] = budget.outcome
    })
  }

  keys(input.envBudgets).forEach(month => {
    keys(input.envBudgets[month]).forEach(envelopeId => {
      if (input.preferZmBudgets && isTagEnvelopeId(envelopeId)) return

      const value = input.envBudgets[month][envelopeId]
      if (!value) return

      result[month] ??= {}
      result[month][envelopeId] = value
    })
  })

  return result
}

function isTagEnvelopeId(envelopeId: TEnvelopeId): boolean {
  return envId.parse(envelopeId).type === EnvType.Tag
}

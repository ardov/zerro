import { previousMonth, toISOMonth } from '../../foundation/date'
import { round } from '../../foundation/numbers'
import type { ById, ByMonth } from '../../foundation/types'
import type { TISOMonth } from '../../foundation/primitives'
import type { TEnvelopeId } from '../envelope-id'
import type { TEnvMetrics } from '../activity/envMetrics'
import type { TGoalInfo } from '../goals/build'
import type { TFxConverter } from '../fx-rates'

export type TBudgetPresetKind =
  | 'coverOverspending'
  | 'releaseSurplus'
  | 'goalAmount'
  | 'averageSpending'
  | 'previousAssignment'
  | 'previousSpending'
  | 'childrenAssigned'

export type TBudgetPreset = {
  kind: TBudgetPresetKind
  /** Total assignment, in the envelope currency. */
  amount: number
  months?: number
}

export function getBudgetPresets(
  metrics: ByMonth<ById<TEnvMetrics>>,
  goals: ByMonth<ById<TGoalInfo>>,
  convertFx: TFxConverter,
  month: TISOMonth,
  id: TEnvelopeId
): TBudgetPreset[] {
  const envelope = metrics[month]?.[id]
  if (!envelope) return []
  const convert = (amount: Record<string, number>) =>
    convertFx(amount, envelope.currency, month)
  const total = convert(envelope.totalAssigned)
  const own = convert(envelope.selfAssigned)
  const available = convert(envelope.totalAvailable)
  const selfAvailable = convert(envelope.selfAvailable)
  const previous = metrics[toISOMonth(previousMonth(month))]?.[id]
  const goal = goals[month]?.[id]
  const result: TBudgetPreset[] = []
  const need = Math.max(-selfAvailable, 0)
  if (need > 0)
    result.push({ kind: 'coverOverspending', amount: round(total + need) })
  if (available > 0)
    result.push({ kind: 'releaseSurplus', amount: round(total - available) })
  if (goal?.targetBudget)
    result.push({
      kind: 'goalAmount',
      amount: goal.targetBudget,
    })

  const spending: number[] = []
  let pastMonth = month
  for (let i = 0; i < 12; i++) {
    pastMonth = toISOMonth(previousMonth(pastMonth))
    const activity = metrics[pastMonth]?.[id]?.totalActivity
    if (activity) spending.push(convert(activity))
  }
  const average = spending.length
    ? round(spending.reduce((sum, amount) => sum + amount, 0) / spending.length)
    : 0
  if (average && spending.length > 1)
    result.push({
      kind: 'averageSpending',
      amount: -average,
      months: spending.length,
    })
  const previousAssignment = convert(previous?.totalAssigned ?? {})
  if (previousAssignment)
    result.push({ kind: 'previousAssignment', amount: previousAssignment })
  const previousSpending = convert(previous?.totalActivity ?? {})
  if (previousSpending)
    result.push({ kind: 'previousSpending', amount: -previousSpending })
  if (envelope.children.length && own && total && own !== total)
    result.push({ kind: 'childrenAssigned', amount: round(total - own) })
  return result
}

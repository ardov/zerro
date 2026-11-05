import { describe, expect, it } from 'vitest'
import { getBudgetPresets, type TBudgetPresetKind } from './presets'
import type { TEnvMetrics } from '../activity/envMetrics'
import type { TGoalInfo } from '../goals/build'
import type { TFxConverter } from '../fx-rates'
import { goalType } from '../goals/types'

const ID = 'tag#parent'
const MONTH = '2026-07'
const convert: TFxConverter = amount =>
  (amount.USD ?? 0) + (amount.EUR ?? 0) * 2
function envelope(overrides: Partial<TEnvMetrics> = {}): TEnvMetrics {
  return {
    id: ID,
    name: 'Parent',
    parent: null,
    children: [],
    currency: 'USD',
    carryNegatives: false,
    selfTransactionCount: 0,
    selfLeftover: {},
    selfAssigned: { USD: 100 },
    selfActivity: {},
    selfAvailable: {},
    childrenTransactionCount: 0,
    childrenLeftover: {},
    childrenAssigned: {},
    childrenActivity: {},
    childrenSurplus: {},
    childrenOverspend: {},
    totalTransactionCount: 0,
    totalLeftover: {},
    totalAssigned: { USD: 100 },
    totalActivity: {},
    totalAvailable: {},
    ...overrides,
  }
}
const goal: TGoalInfo = {
  id: ID,
  goal: { type: goalType.MONTHLY, amount: 50 },
  month: MONTH,
  currency: 'USD',
  progress: 1,
  needNow: 0,
  needStart: 50,
  targetBudget: 50,
}
type Scenario = {
  name: string
  kind: TBudgetPresetKind
  current?: Partial<TEnvMetrics>
  previous?: Partial<TEnvMetrics>
  earlier?: Partial<TEnvMetrics>
  goal?: TGoalInfo
  amount?: number
  months?: number
}
const cases: Scenario[] = [
  {
    name: 'covers the parent pool even when child surplus makes the total positive',
    kind: 'coverOverspending',
    current: { selfAvailable: { USD: -20 }, totalAvailable: { USD: 10 } },
    amount: 120,
  },
  {
    name: 'hides coverage when there is no deficit',
    kind: 'coverOverspending',
  },
  {
    name: 'releases the total surplus',
    kind: 'releaseSurplus',
    current: { totalAvailable: { USD: 30 } },
    amount: 70,
  },
  { name: 'hides release without surplus', kind: 'releaseSurplus' },
  {
    name: 'sets the exact goal even below the current assignment',
    kind: 'goalAmount',
    goal,
    amount: 50,
  },
  { name: 'hides the goal amount without a goal', kind: 'goalAmount' },
  {
    name: 'hides a zero goal target',
    kind: 'goalAmount',
    goal: { ...goal, targetBudget: 0 },
  },
  {
    name: 'averages available past months after currency conversion',
    kind: 'averageSpending',
    previous: { totalActivity: { USD: -40 } },
    earlier: { totalActivity: { EUR: -30 } },
    amount: 50,
    months: 2,
  },
  {
    name: 'requires more than one month for an average',
    kind: 'averageSpending',
    previous: { totalActivity: { USD: -40 } },
  },
  {
    name: 'hides a zero average',
    kind: 'averageSpending',
    previous: {},
    earlier: {},
  },
  {
    name: 'copies the previous total assignment',
    kind: 'previousAssignment',
    previous: { totalAssigned: { EUR: 35 } },
    amount: 70,
  },
  {
    name: 'hides a zero previous assignment',
    kind: 'previousAssignment',
    previous: { totalAssigned: {} },
  },
  {
    name: 'assigns previous spending',
    kind: 'previousSpending',
    previous: { totalActivity: { USD: -30 } },
    amount: 30,
  },
  { name: 'hides absent previous spending', kind: 'previousSpending' },
  {
    name: 'sets the sum of child assignments',
    kind: 'childrenAssigned',
    current: { children: ['tag#child'], selfAssigned: { USD: 40 } },
    amount: 60,
  },
  {
    name: 'hides the child sum without children',
    kind: 'childrenAssigned',
    current: { selfAssigned: { USD: 40 } },
  },
  {
    name: 'hides an already selected child sum',
    kind: 'childrenAssigned',
    current: { children: ['tag#child'], selfAssigned: {} },
  },
  {
    name: 'hides a zero child sum',
    kind: 'childrenAssigned',
    current: { children: ['tag#child'] },
  },
]

describe('budget presets', () => {
  it.each(cases)(
    '$name',
    ({ kind, current, previous, earlier, goal, amount, months }) => {
      const metrics = {
        [MONTH]: { [ID]: envelope(current) },
        ...(previous ? { '2026-06': { [ID]: envelope(previous) } } : {}),
        ...(earlier ? { '2026-05': { [ID]: envelope(earlier) } } : {}),
      }
      const result = getBudgetPresets(
        metrics,
        goal ? { [MONTH]: { [ID]: goal } } : {},
        convert,
        MONTH,
        ID
      ).find(p => p.kind === kind)
      if (amount === undefined) expect(result).toBeUndefined()
      else
        expect(result).toEqual({ kind, amount, ...(months ? { months } : {}) })
    }
  )

  it('returns no presets for an unavailable envelope', () => {
    expect(getBudgetPresets({}, {}, convert, MONTH, ID)).toEqual([])
  })
})

import { createSelector } from '@reduxjs/toolkit'
import type {
  ById,
  TTransaction,
  TEnvelopeId,
  TFxAmount,
  TISOMonth,
  TRates,
  ByMonth,
} from '@shared/types'
import type { TSelector } from '@store'
import { keys } from '@shared/helpers/keys'
import { addFxAmount, convertFx, round } from '@shared/helpers/money'
import { fxRates, TFxRateData, TFxRates } from '@entities/fxRate'
import { getEnvelopeBudgets } from '@entities/budget'
import { calculateGoalProgress, getGoals, TGoal } from '@entities/goal'
import { getEnvelopes, TEnvelope } from '@entities/envelope'
import { getActivity, TEnvelopeNode, TMonthActivity } from './parts/activity'
import { getMonthList } from './parts/monthList'
import { withPerf } from '@shared/helpers/performance'

function makeEnvelopeWithData(e: TEnvelope) {
  return {
    id: e.id,
    env: e,

    // Self metrics
    selfLeftoverValue: 0,
    selfLeftover: {} as TFxAmount,
    selfBudgetedValue: 0,
    selfBudgeted: {} as TFxAmount,
    selfActivityValue: 0,
    selfActivity: {} as TFxAmount,
    transactions: [] as TTransaction[],

    // Children metrics
    childrenLeftoverValue: 0,
    childrenLeftover: {} as TFxAmount,
    childrenBudgetedValue: 0,
    childrenBudgeted: {} as TFxAmount,
    childrenActivityValue: 0,
    childrenActivity: {} as TFxAmount,
    childrenSurplusValue: 0,
    childrenSurplus: {} as TFxAmount, // positive balances
    childrenOverspendValue: 0,
    childrenOverspend: {} as TFxAmount, // negative balances (will be covered from parent balance)

    // Computed metrics

    get selfAvailableValue(): number {
      // Tricky moment children overspend covered by parent balance ⤵
      // selfLeftover + selfBudgeted + selfActivity + childrenOverspend
      return round(
        this.selfLeftoverValue +
          this.selfBudgetedValue +
          this.selfActivityValue +
          this.childrenOverspendValue
      )
    },
    get selfAvailable(): TFxAmount {
      return { [this.env.currency]: this.selfAvailableValue }
    },

    get totalLeftover(): TFxAmount {
      return addFxAmount(this.selfLeftover, this.childrenLeftover)
    },
    get totalBudgeted(): TFxAmount {
      return addFxAmount(this.selfBudgeted, this.childrenBudgeted)
    },
    get totalActivity(): TFxAmount {
      return addFxAmount(this.selfActivity, this.childrenActivity)
    },
    get totalAvailable(): TFxAmount {
      // children overspend already counted in selfAvailable
      return addFxAmount(this.selfAvailable, this.childrenSurplus)
    },

    // Goal
    goal: null as TGoal | null, // goal itself
    goalProgress: null as number | null, // [0-1] percent of goal completion
    goalNeed: null as number | null, // amount of money that budget lacks
    goalTarget: null as number | null, // desired budget to complete the goal
  }
}

export type IEnvelopeWithData = ReturnType<typeof makeEnvelopeWithData>

export const getRatesByMonth: TSelector<ByMonth<TFxRateData>> = createSelector(
  [getMonthList, fxRates.getter],
  withPerf('getRatesByMonth', (months, getter) => {
    const res: ByMonth<TFxRateData> = {}
    months.forEach(month => (res[month] = getter(month)))
    return res
  })
)

export const getCalculatedEnvelopes: TSelector<
  ByMonth<ById<IEnvelopeWithData>>
> = createSelector(
  [
    getMonthList,
    getEnvelopes,
    getActivity,
    getEnvelopeBudgets,
    fxRates.getter,
    getGoals,
  ],
  withPerf('🤡getCalculatedEnvelopes', aggregateEnvelopeBudgets)
)

function aggregateEnvelopeBudgets(
  monthList: TISOMonth[],
  envelopes: ById<TEnvelope>,
  activity: ByMonth<TMonthActivity>,
  budgets: ByMonth<{ [id: TEnvelopeId]: number }>,
  getRates: (month: TISOMonth) => TFxRateData,
  goals: ByMonth<Record<TEnvelopeId, TGoal | null>>
) {
  const result: ByMonth<ById<IEnvelopeWithData>> = {}

  let prevNode: ById<IEnvelopeWithData> = {}
  monthList.forEach(month => {
    const node: ById<IEnvelopeWithData> = {}
    const rateData = getRates(month)

    // Step 1: fill with placeholders
    createPlaceholders(node, envelopes)

    // Step 2: fill self metrics
    addSelfMetrics(
      node,
      prevNode,
      budgets[month],
      activity[month]?.envelopes,
      rateData.rates
    )

    // Step 3: fill children metrics
    addChildrenData(node, rateData.rates)

    // Step 4: fill goal metrics
    addGoalData(
      month,
      node,
      prevNode,
      goals[month],
      activity[month],
      rateData.rates
    )

    result[month] = node
    prevNode = node
  })

  return result
}

/**
 * Creates placeholders for all envelopes
 */
function createPlaceholders(
  node: ById<IEnvelopeWithData>,
  envelopes: ById<TEnvelope>
) {
  keys(envelopes).forEach(id => {
    node[id] = makeEnvelopeWithData(envelopes[id])
  })
}

/**
 * Populates envelopes with basic metrics:
 * selfLeftover, selfBudgeted, selfActivity
 */
function addSelfMetrics(
  node: ById<IEnvelopeWithData>,
  prevMonth: ById<IEnvelopeWithData>,
  budgets: Record<TEnvelopeId, number> = {},
  activity: Record<TEnvelopeId, TEnvelopeNode> = {},
  rates: TRates
) {
  Object.values(node).forEach(envData => {
    const { id, currency } = envData.env
    envData.selfLeftoverValue = getLeftover(
      prevMonth[id]?.selfAvailableValue,
      envData.env.carryNegatives
    )
    envData.selfLeftover = { [currency]: envData.selfLeftoverValue }
    envData.selfBudgetedValue = budgets[id] || 0
    envData.selfBudgeted = { [currency]: envData.selfBudgetedValue }
    envData.selfActivity = activity[id]?.activity || {}
    envData.selfActivityValue = convertFx(envData.selfActivity, currency, rates)
    envData.transactions = activity[id]?.transactions || []
  })

  /** Returns leftover depending on envelope settings */
  function getLeftover(
    prevAvailable: number | undefined = 0,
    carryNegatives: boolean
  ): number {
    if (prevAvailable >= 0) return prevAvailable
    if (carryNegatives) return prevAvailable
    return 0
  }
}

/**
 * Calculates children metrics for each parent envelope
 */
function addChildrenData(node: ById<IEnvelopeWithData>, rates: TRates) {
  Object.values(node).forEach(parent => {
    if (parent.env.children.length === 0) return

    parent.env.children.forEach(childId => {
      const child = node[childId]
      parent.childrenLeftover = addFxAmount(
        parent.childrenLeftover,
        child.totalLeftover
      )
      parent.childrenBudgeted = addFxAmount(
        parent.childrenBudgeted,
        child.totalBudgeted
      )
      parent.childrenActivity = addFxAmount(
        parent.childrenActivity,
        child.totalActivity
      )
      const isOverspending = child.selfAvailableValue < 0
      if (isOverspending) {
        parent.childrenOverspend = addFxAmount(
          parent.childrenOverspend,
          child.totalAvailable
        )
      } else {
        parent.childrenSurplus = addFxAmount(
          parent.childrenSurplus,
          child.totalAvailable
        )
      }
    })

    parent.childrenOverspendValue = convertFx(
      parent.childrenOverspend,
      parent.env.currency,
      rates
    )
    parent.childrenSurplusValue = convertFx(
      parent.childrenSurplus,
      parent.env.currency,
      rates
    )
  })
}

/**
 * Adds monthly goals and calculates their progress
 */
function addGoalData(
  month: TISOMonth,
  node: ById<IEnvelopeWithData>,
  prevNode: ById<IEnvelopeWithData>,
  goals: Record<TEnvelopeId, TGoal | null>,
  monthActivity: TMonthActivity,
  rates: TFxRates
) {
  Object.values(node).forEach(envelope => {
    envelope.goal = getGoal(
      month,
      goals?.[envelope.id],
      prevNode?.[envelope.id]?.goal
    )

    if (!envelope.goal) return

    const toValue = (amount?: TFxAmount) =>
      amount ? convertFx(amount, envelope.env.currency, rates) : 0

    const goalProgress = calculateGoalProgress(envelope.goal, {
      leftover: toValue(envelope.totalLeftover),
      budgeted: toValue(envelope.totalBudgeted),
      available: toValue(envelope.totalAvailable),
      generalIncome: toValue(monthActivity?.generalIncome?.activity),
      month,
    })
    envelope.goalProgress = goalProgress.progress
    envelope.goalNeed = goalProgress.need
    envelope.goalTarget = goalProgress.target
  })

  /** Returns valid goal */
  function getGoal(
    currMonth: TISOMonth,
    currGoal?: TGoal | null,
    prevGoal?: TGoal | null
  ) {
    const goal =
      currGoal !== undefined
        ? currGoal
        : prevGoal !== undefined
        ? prevGoal
        : null
    if (goal?.end && goal.end < currMonth) return null
    return goal
  }
}

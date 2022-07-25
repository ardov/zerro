import { createSelector } from '@reduxjs/toolkit'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import { getMonthDates } from 'pages/Budgets/selectors'
import { ById, ITransaction, TFxAmount, TISOMonth } from 'shared/types'
import { getEnvelopes, IEnvelope } from './parts/envelopes'
import { keys } from 'shared/helpers/keys'
import { getActivity, TMonthActivity } from './parts/activity'
import { addFxAmount, convertFx } from 'shared/helpers/currencyHelpers'
import { TFxRates } from 'models/fxRate/fxRateStore'
import { getFxRatesGetter } from 'models/fxRate'
import { getEnvelopeBudgets } from 'models/envelopeBudgets'
import { calculateGoalProgress, getGoals, TGoal } from 'models/goal'

export interface IEnvelopeWithData extends IEnvelope {
  /** Activity calculated from income and outcome but depends on envelope settings. `keepIncome` affects this calculation */

  /** Activity converted to a currency of envelope */
  activity: TFxAmount
  activitySelf: TFxAmount
  activityChildren: TFxAmount

  /** Leftover in a currency of envelope */
  leftover: TFxAmount
  leftoverSelf: TFxAmount
  leftoverChildren: TFxAmount

  /** Budget in a currency of envelope */
  budgeted: TFxAmount
  budgetedSelf: TFxAmount
  budgetedChildren: TFxAmount

  /** Available = `leftover` + `budgeted` + `activity` */
  available: TFxAmount
  availableSelf: TFxAmount
  availableChildrenPositive: TFxAmount
  availableChildrenNegative: TFxAmount

  goal: TGoal | null
  /** number from 0 to 1. It is goal completion progress for month or overall (for TARGET_BALANCE without end date) */
  goalProgress: number | null
  /** amount of money you should add to your budget to complete the goal */
  goalNeed: TFxAmount | null
  /** budget needed to complete the goal in current */
  goalTarget: TFxAmount | null

  transactions: ITransaction[]
}

type TCalculatedEnvelopes = Record<TEnvelopeId, IEnvelopeWithData>

export const getCalculatedEnvelopes = createSelector(
  [
    getMonthDates,
    getEnvelopes,
    getActivity,
    getEnvelopeBudgets,
    getFxRatesGetter,
    getGoals,
  ],
  aggregateEnvelopeBudgets
)

function aggregateEnvelopeBudgets(
  monthList: TISOMonth[],
  envelopes: ById<IEnvelope>,
  activity: Record<TISOMonth, TMonthActivity>,
  budgets: Record<TISOMonth, { [id: TEnvelopeId]: number }>,
  getRates: (month: TISOMonth) => TFxRates,
  goals: Record<TISOMonth, Record<TEnvelopeId, TGoal | null>>
) {
  const ids = keys(envelopes)
  const result: Record<TISOMonth, TCalculatedEnvelopes> = {}

  let prevValues: TCalculatedEnvelopes = {}

  monthList.forEach(month => {
    const currRates = getRates(month)
    const currBudgets = budgets[month] || {}
    const currActivity = activity[month]?.envelopes || {}

    const node: TCalculatedEnvelopes = {}

    ids.forEach(id => {
      let envelope = makeEnvelopeWithData(envelopes[id])
      node[id] = envelope
    })

    // Self check that all envelopes present
    keys(currActivity).forEach(id => {
      if (!node[id]) {
        console.error(`Unknown envelope: ${id}`)
      }
    })

    ids.forEach(id => {
      let parent = node[id]
      if (parent.parent) return
      parent.children.forEach(childId => {
        let child = node[childId]
        let currency = child.currency

        child.leftover = child.leftoverSelf = getLeftover(
          prevValues[childId]?.availableSelf,
          child.carryNegatives
        )
        parent.leftoverChildren = addFxAmount(
          parent.leftoverChildren,
          child.leftover
        )

        child.budgeted = child.budgetedSelf = {
          [currency]: currBudgets[childId] || 0,
        }
        parent.budgetedChildren = addFxAmount(
          parent.budgetedChildren,
          child.budgeted
        )

        child.activity = child.activitySelf =
          currActivity[childId]?.activity || {}
        parent.activityChildren = addFxAmount(
          parent.activityChildren,
          child.activity
        )

        let childAvailable = addFxAmount(
          child.leftover,
          child.activity,
          child.budgeted
        )
        let childAvailableValue = convertFx(childAvailable, currency, currRates)

        child.available = child.availableSelf = {
          [currency]: childAvailableValue,
        }
        if (childAvailableValue > 0) {
          parent.availableChildrenPositive = addFxAmount(
            parent.availableChildrenPositive,
            child.available
          )
        }
        if (childAvailableValue < 0) {
          parent.availableChildrenNegative = addFxAmount(
            parent.availableChildrenNegative,
            child.available
          )
        }

        child.transactions = currActivity[childId]?.transactions || []
      })

      let currency = parent.currency

      parent.leftoverSelf = getLeftover(
        prevValues[id]?.availableSelf,
        parent.carryNegatives
      )
      parent.leftover = addFxAmount(
        parent.leftoverSelf,
        parent.leftoverChildren
      )

      parent.budgetedSelf = { [currency]: currBudgets[id] || 0 }
      parent.budgeted = addFxAmount(
        parent.budgetedSelf,
        parent.budgetedChildren
      )

      parent.activitySelf = currActivity[id]?.activity || {}
      parent.activity = addFxAmount(
        parent.activitySelf,
        parent.activityChildren
      )

      let parentAvailable = addFxAmount(
        parent.leftoverSelf,
        parent.budgetedSelf,
        parent.activitySelf,
        parent.availableChildrenNegative
      )
      let parentAvailableValue = convertFx(parentAvailable, currency, currRates)
      parent.availableSelf = { [currency]: parentAvailableValue }
      parent.available = addFxAmount(
        parent.availableSelf,
        parent.availableChildrenPositive
      )

      parent.transactions = currActivity[id]?.transactions || []
    })

    result[month] = node
    prevValues = node
  })

  // Fill in goal data
  let prevGoals: Record<TEnvelopeId, TGoal | null> = {}
  keys(result).forEach(month => {
    const envelopes = result[month]
    Object.values(envelopes).forEach(envelope => {
      const id = envelope.id

      // Set goal
      if (goals[month]?.[id] !== undefined) {
        envelope.goal = goals[month][id]
      } else {
        envelope.goal = prevGoals[id] || null
      }
      // Remove goal if it is already ended
      if (envelope.goal?.end && envelope.goal?.end > month) {
        envelope.goal = null
      }
      prevGoals[id] = envelope.goal

      if (!envelope.goal) return

      const toValue = (amount?: TFxAmount) =>
        amount ? convertFx(amount, envelope.currency, getRates(month)) : 0

      const goalProgress = calculateGoalProgress(envelope.goal, {
        leftover: toValue(envelope.leftover),
        budgeted: toValue(envelope.budgeted),
        available: toValue(envelope.available),
        generalIncome: toValue(activity[month]?.generalIncome?.activity),
        month,
      })
      envelope.goalProgress = goalProgress.progress
      envelope.goalNeed = { [envelope.currency]: goalProgress.need }
      envelope.goalTarget = { [envelope.currency]: goalProgress.target }
    })
  })

  return result
}

function makeEnvelopeWithData(e: IEnvelope): IEnvelopeWithData {
  return {
    ...e,

    activity: {},
    activitySelf: {},
    activityChildren: {},

    leftover: {},
    leftoverSelf: {},
    leftoverChildren: {},

    budgeted: {},
    budgetedSelf: {},
    budgetedChildren: {},

    available: {},
    availableSelf: {},
    availableChildrenPositive: {},
    availableChildrenNegative: {},

    goal: null,
    goalProgress: null,
    goalNeed: null,
    goalTarget: null,

    transactions: [],
  }
}

function getLeftover(
  prevAvailable: TFxAmount | undefined = {},
  carryNegatives: boolean
): TFxAmount {
  const currencies = keys(prevAvailable)
  if (currencies.length === 0) return {}
  if (currencies.length > 1) throw Error('Multiple currencies in leftover')
  const currency = currencies[0]
  if (prevAvailable[currency] >= 0) return prevAvailable
  if (carryNegatives) return prevAvailable
  return {}
}

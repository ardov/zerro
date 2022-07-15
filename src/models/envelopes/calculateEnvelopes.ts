import { createSelector } from '@reduxjs/toolkit'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import { getMonthDates } from 'pages/Budgets/selectors'
import { ById, TFxCode, TISOMonth } from 'shared/types'
import { getEnvelopes, IEnvelope } from './parts/envelopes'
import { addFxAmount, convertFx, TFxAmount } from './helpers/fxAmount'
import { keys } from 'shared/helpers/keys'
import { getActivity, TMonthActivity } from './parts/activity'
import { getMonthlyRates } from './parts/rates'
import { getEnvelopeBudgets } from './parts/budgets'

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
}

type TCalculatedEnvelopes = Record<TEnvelopeId, IEnvelopeWithData>

export const getCalculatedEnvelopes = createSelector(
  [
    getMonthDates,
    getEnvelopes,
    getActivity,
    getEnvelopeBudgets,
    getMonthlyRates,
  ],
  aggregateEnvelopeBudgets
)

function aggregateEnvelopeBudgets(
  monthList: TISOMonth[],
  envelopes: ById<IEnvelope>,
  activity: Record<TISOMonth, TMonthActivity>,
  budgets: Record<TISOMonth, { [id: TEnvelopeId]: number }>,
  rates: Record<TISOMonth, { [fx: TFxCode]: number }>
) {
  const ids = keys(envelopes)
  const result: Record<TISOMonth, TCalculatedEnvelopes> = {}

  let prevValues: TCalculatedEnvelopes = {}

  monthList.forEach(date => {
    const currRates = rates[date]
    const currBudgets = budgets[date] || {}
    const currActivity = activity[date]?.envelopes || {}

    const node: TCalculatedEnvelopes = {}

    ids.forEach(id => {
      let envelope = makeEnvelopeWithData(envelopes[id])
      node[id] = envelope
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
    })

    result[date] = node
    prevValues = node
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

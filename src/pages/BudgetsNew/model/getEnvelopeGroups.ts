import { createSelector } from '@reduxjs/toolkit'
import {
  getComputedTotals,
  getEnvelopeStructure,
  TEnvelopeBudgets,
} from 'models/envelopes'
import { IEnvelopeWithData } from 'models/envelopes/calculateEnvelopes'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import { addFxAmount, convertFx, isZero } from 'shared/helpers/currencyHelpers'
import { keys } from 'shared/helpers/keys'
import { Modify, TFxAmount, TFxCode, TISOMonth } from 'shared/types'
import { TSelector } from 'store'

export type TEnvelopePopulated = Modify<
  IEnvelopeWithData,
  {
    children: TEnvelopePopulated[]
    isDefaultVisible: boolean
    displayCurrency: TFxCode
    displayLeftover: number
    displayBudgeted: number
    displayActivity: number
    displayAvailable: number
    displayHiddenOverspend: number
    hasCustomCurency: boolean
    isSelf: boolean
  }
>

export type TGroupInfo = {
  name: string
  leftover: TFxAmount
  budgeted: TFxAmount
  activity: TFxAmount
  available: TFxAmount
  displayLeftover: number
  displayBudgeted: number
  displayActivity: number
  displayAvailable: number
  children: TEnvelopePopulated[]
}

export const getEnvelopeGroups: TSelector<Record<TISOMonth, TGroupInfo[]>> =
  createSelector(
    [getComputedTotals, getEnvelopeStructure],
    (computedTotals, structure) => {
      const result: Record<TISOMonth, TGroupInfo[]> = {}

      keys(computedTotals).forEach(month => {
        const monthInfo = computedTotals[month]
        const { rates, currency } = monthInfo

        result[month] = structure.map(group => {
          const children = group.children.map(node =>
            populateEnvelope(node.id, node.children, monthInfo)
          )

          const leftover = addFxAmount(...children.map(e => e.leftover))
          const budgeted = addFxAmount(...children.map(e => e.budgeted))
          const activity = addFxAmount(...children.map(e => e.activity))
          const available = addFxAmount(...children.map(e => e.available))

          return {
            name: group.name,
            leftover,
            budgeted,
            activity,
            available,
            displayLeftover: convertFx(leftover, currency, rates),
            displayBudgeted: convertFx(budgeted, currency, rates),
            displayActivity: convertFx(activity, currency, rates),
            displayAvailable: convertFx(available, currency, rates),
            children,
          }
        })
      })

      return result
    }
  )

/**
 * Populates envelope for easier display
 * @param id
 * @param children
 * @returns
 */
function populateEnvelope(
  id: TEnvelopeId,
  children: TEnvelopeId[],
  monthInfo: TEnvelopeBudgets
): TEnvelopePopulated {
  const envelope = monthInfo.envelopes[id]
  const displayCurrency = monthInfo.currency

  const convert = (a: TFxAmount) =>
    convertFx(a, displayCurrency, monthInfo.rates)

  const displayLeftover = convert(envelope.leftover)
  const displayBudgeted = convert(envelope.budgeted)
  const displayActivity = convert(envelope.activity)
  const displayAvailable = convert(envelope.available)

  let displayHiddenOverspend = 0
  const availableSelf = convert(envelope.availableSelf)
  if (displayAvailable >= 0 && availableSelf < 0) {
    displayHiddenOverspend = availableSelf
  }

  const hasCustomCurency = envelope.currency !== displayCurrency

  const populatedChildren = children.map(id =>
    populateEnvelope(id, [], monthInfo)
  )
  const hasChildren = !!populatedChildren.length
  const hasVisibleChildren = !!populatedChildren.filter(e => e.isDefaultVisible)
    .length

  const populated: TEnvelopePopulated = {
    ...envelope,
    isDefaultVisible:
      envelope.showInBudget ||
      !!envelope.goal ||
      !isZero(envelope.budgeted) ||
      !isZero(envelope.activity) ||
      !isZero(envelope.available) ||
      (hasChildren && hasVisibleChildren),
    displayCurrency,
    displayLeftover,
    displayBudgeted,
    displayActivity,
    displayAvailable,
    displayHiddenOverspend,
    hasCustomCurency,
    children:
      !isZero(envelope.activitySelf) && hasChildren
        ? [populateSelfEnvelope(envelope, monthInfo), ...populatedChildren]
        : populatedChildren,
    isSelf: false,
  }

  return populated
}

function populateSelfEnvelope(
  envelope: IEnvelopeWithData,
  monthInfo: TEnvelopeBudgets
): TEnvelopePopulated {
  const displayCurrency = monthInfo.currency
  const convert = (a: TFxAmount) =>
    convertFx(a, displayCurrency, monthInfo.rates)
  return {
    ...envelope,
    symbol: '-',
    color: null,
    name: `${envelope.name} (основная)`,
    isDefaultVisible: true,
    displayCurrency,
    displayLeftover: convert(envelope.leftoverSelf),
    displayBudgeted: convert(envelope.budgetedSelf),
    displayActivity: convert(envelope.activitySelf),
    displayAvailable: convert(envelope.availableSelf),
    displayHiddenOverspend: 0,
    hasCustomCurency: envelope.currency !== displayCurrency,
    children: [],
    isSelf: true,
  }
}

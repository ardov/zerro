import { createSelector } from '@reduxjs/toolkit'
import { addFxAmount, convertFx, isZero } from '@shared/helpers/money'
import { keys } from '@shared/helpers/keys'
import {
  Modify,
  TEnvelopeId,
  TFxAmount,
  TFxCode,
  TISOMonth,
} from '@shared/types'
import { TSelector } from '@store'
import { envelopeVisibility, getEnvelopeStructure } from '@entities/envelope'
import {
  getMonthTotals,
  TMonthTotals,
  IEnvelopeWithData,
} from '@entities/envelopeData'

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
    [getMonthTotals, getEnvelopeStructure],
    (computedTotals, structure) => {
      const result: Record<TISOMonth, TGroupInfo[]> = {}

      keys(computedTotals).forEach(month => {
        const monthInfo = computedTotals[month]
        const { rates, currency } = monthInfo

        result[month] = structure.map(group => {
          const children = group.children.map(node =>
            populateEnvelope(node.id, node.children, monthInfo)
          )

          const leftover = addFxAmount(...children.map(e => e.totalLeftover))
          const budgeted = addFxAmount(...children.map(e => e.totalBudgeted))
          const activity = addFxAmount(...children.map(e => e.totalActivity))
          const available = addFxAmount(...children.map(e => e.totalAvailable))

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
  monthInfo: TMonthTotals
): TEnvelopePopulated {
  const envelope = monthInfo.envelopes[id]
  const displayCurrency = monthInfo.currency

  const convert = (a: TFxAmount) =>
    convertFx(a, displayCurrency, monthInfo.rates)

  const displayLeftover = convert(envelope.totalLeftover)
  const displayBudgeted = convert(envelope.totalBudgeted)
  const displayActivity = convert(envelope.totalActivity)
  const displayAvailable = convert(envelope.totalAvailable)

  let displayHiddenOverspend = 0
  const availableSelf = convert(envelope.selfAvailable)
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
    isDefaultVisible: getDefaultVisibility(envelope, hasVisibleChildren),
    displayCurrency,
    displayLeftover,
    displayBudgeted,
    displayActivity,
    displayAvailable,
    displayHiddenOverspend,
    hasCustomCurency,
    children:
      !isZero(envelope.selfActivity) && hasChildren
        ? [populateSelfEnvelope(envelope, monthInfo), ...populatedChildren]
        : populatedChildren,
    isSelf: false,
  }

  return populated
}

function populateSelfEnvelope(
  envelope: IEnvelopeWithData,
  monthInfo: TMonthTotals
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
    displayLeftover: convert(envelope.selfLeftover),
    displayBudgeted: convert(envelope.selfBudgeted),
    displayActivity: convert(envelope.selfActivity),
    displayAvailable: convert(envelope.selfAvailable),
    displayHiddenOverspend: 0,
    hasCustomCurency: envelope.currency !== displayCurrency,
    children: [],
    isSelf: true,
  }
}

function getDefaultVisibility(
  envelope: IEnvelopeWithData,
  hasVisibleChildren: boolean
): boolean {
  if (envelope.visibility === envelopeVisibility.visible) {
    return true
  }
  if (envelope.visibility === envelopeVisibility.hidden) {
    return false
  }
  return (
    !!envelope.goal ||
    !isZero(envelope.selfBudgeted) ||
    !isZero(envelope.selfActivity) ||
    !isZero(envelope.selfAvailable) ||
    hasVisibleChildren
  )
}

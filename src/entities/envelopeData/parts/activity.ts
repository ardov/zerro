import { TISOMonth, ITransaction, TFxAmount, TEnvelopeId } from '@shared/types'
import { toISOMonth } from '@shared/helpers/date'
import { getEnvelopes } from '@entities/envelope'
import { createSelector } from '@reduxjs/toolkit'
import { TSelector } from '@store'
import {
  getBudgetChanges,
  TBudgetChange,
  trDirection,
} from './getBudgetChanges'
import { addFxAmount } from '@shared/helpers/money'

export type TEnvelopeNode = {
  activity: TFxAmount
  transactions: ITransaction[]
}

export type TMonthActivity = {
  date: TISOMonth
  /** Total balance change of in budget accounts */
  totalActivity: TFxAmount
  /** Unsorted income from envelopes */
  generalIncome: TEnvelopeNode
  /** Transfer fees activity (also includes currency exchange) */
  transferFees: TEnvelopeNode
  /** Activity by envelope */
  envelopes: Record<TEnvelopeId, TEnvelopeNode>
}

export const getActivity: TSelector<Record<TISOMonth, TMonthActivity>> =
  createSelector([getBudgetChanges, getEnvelopes], (changes, envelopes): Record<
    TISOMonth,
    TMonthActivity
  > => {
    const result: Record<TISOMonth, TMonthActivity> = {}

    changes.forEach(ch => {
      let date = toISOMonth(ch.date)
      let month = (result[date] ??= makeMonthInfo(date))
      month.totalActivity = addFxAmount(month.totalActivity, ch.diff)

      if (ch.direction === trDirection.internal) {
        return addToNode(month.transferFees, ch)
      }

      if (ch.direction === trDirection.outcome) {
        return addToEnvelope(month, ch)
      }

      if (ch.direction === trDirection.income && ch.envelope) {
        if (envelopes[ch.envelope].keepIncome) {
          return addToEnvelope(month, ch)
        }

        return addToNode(month.generalIncome, ch)
      }

      throw new Error('Unknown direction: ' + ch.direction)
    })

    return result
  })

function makeMonthInfo(date: TMonthActivity['date']): TMonthActivity {
  return {
    date,
    totalActivity: {},
    generalIncome: makeEnvelopeNode(),
    transferFees: makeEnvelopeNode(),
    envelopes: {},
  }
}

function makeEnvelopeNode(): TEnvelopeNode {
  return { activity: {}, transactions: [] }
}

function addToNode(node: TEnvelopeNode, change: TBudgetChange) {
  node.transactions.push(change.transaction)
  node.activity = addFxAmount(node.activity, change.diff)
}

function addToEnvelope(node: TMonthActivity, change: TBudgetChange) {
  let id = change.envelope
  if (!id) throw new Error('No envelope')

  node.envelopes[id] ??= makeEnvelopeNode()
  addToNode(node.envelopes[id], change)
}

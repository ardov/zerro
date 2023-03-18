import { createSelector } from '@reduxjs/toolkit'
import { ByMonth, TFxAmount } from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { TSelector } from '@store/index'

import { envelopeModel, EnvType, TEnvelopeId } from '@entities/envelope'
import { fxRateModel } from '@entities/currency/fxRate'

import { EnvActivity, getRawActivity } from './1 - rawActivity'

/** Filter mode for transactions in balance */
export enum TrFilterMode {
  /** Income not assigned to envelope */
  GeneralIncome = 'generalIncome',
  /** Transactions assigned to envelope (default) */
  Envelope = 'envelope',
  /** All income */
  Income = 'income',
  /** All outcome */
  Outcome = 'outcome',
  /** All transactions */
  All = 'All',
}

type TActivityByType = {
  tags: Record<TEnvelopeId, { income?: EnvActivity; outcome?: EnvActivity }>
  transfers: Record<
    TEnvelopeId,
    { income?: EnvActivity; outcome?: EnvActivity }
  >
  debts: Record<TEnvelopeId, { income?: EnvActivity; outcome?: EnvActivity }>
  internal: EnvActivity
}

const getActivityByType: TSelector<ByMonth<TActivityByType>> = createSelector(
  [getRawActivity],
  activity => {
    const res: ByMonth<TActivityByType> = {}
    keys(activity).forEach(month => {
      const { internal, income, outcome } = activity[month]
      const node: TActivityByType = {
        tags: {},
        transfers: {},
        debts: {},
        internal,
      }
      node.internal = internal
      keys(income).forEach(id => {
        const category = getEnvCategory(id)
        node[category][id] = { income: income[id] }
      })
      keys(outcome).forEach(id => {
        const category = getEnvCategory(id)
        if (node[category][id]) node[category][id].outcome = outcome[id]
        else node[category][id] = { outcome: outcome[id] }
      })
      res[month] = node
    })
    return res

    function getEnvCategory(id: TEnvelopeId) {
      const { type } = envelopeModel.parseId(id)
      if (type === EnvType.Tag) return 'tags'
      if (type === EnvType.Account) return 'transfers'
      return 'debts'
    }
  }
)

// —————————————————————————————————————————————————————————————————————————————
// —————————————————————————————————————————————————————————————————————————————

export type TSortedActivityNode = {
  id: TEnvelopeId | 'transferFees'
  trMode: TrFilterMode // used for filtering
  total: EnvActivity // have to know the value to detect if it is positive
  income?: EnvActivity
  outcome?: EnvActivity
  keepIncome?: boolean
}

export type TSortedActivity = {
  incomes: TSortedActivityNode[]
  outcomes: TSortedActivityNode[]
  transfers: TSortedActivityNode[]
  debts: TSortedActivityNode[]
  incomesTotal: EnvActivity
  outcomesTotal: EnvActivity
  transfersTotal: EnvActivity
  debtsTotal: EnvActivity
}

export const getSortedActivity: TSelector<ByMonth<TSortedActivity>> =
  createSelector(
    [
      getActivityByType,
      envelopeModel.getKeepingEnvelopes,
      fxRateModel.converter,
    ],
    (activity, keepingEnvelopes, convert) => {
      const res: ByMonth<TSortedActivity> = {}

      keys(activity).forEach(month => {
        const { tags, transfers, debts, internal } = activity[month]
        const toValue = (a: TFxAmount) => convert(a, 'USD', month)

        const node: TSortedActivity = {
          incomes: [],
          outcomes: [],
          transfers: [],
          debts: [],
          incomesTotal: new EnvActivity(),
          outcomesTotal: new EnvActivity(),
          transfersTotal: new EnvActivity(),
          debtsTotal: new EnvActivity(),
        }

        keys(tags).forEach(id => {
          const { income, outcome } = tags[id]
          const keepIncome = keepingEnvelopes.includes(id)
          if (keepIncome) {
            const envInfo: TSortedActivityNode = {
              id,
              income,
              outcome,
              keepIncome,
              trMode: TrFilterMode.Envelope,
              total: EnvActivity.merge(income, outcome),
            }
            const value = toValue(envInfo.total.total)
            if (value > 0) node.incomes.push(envInfo)
            if (value <= 0) node.outcomes.push(envInfo)
            return
          }
          if (income) {
            node.incomes.push({
              id,
              total: income,
              income,
              keepIncome,
              trMode: TrFilterMode.GeneralIncome,
            })
          }
          if (outcome) {
            node.outcomes.push({
              id,
              total: outcome,
              outcome,
              keepIncome,
              trMode: TrFilterMode.Envelope,
            })
          }
        })

        if (toValue(internal.total)) {
          node.transfers.push({
            id: 'transferFees',
            total: internal,
            trMode: TrFilterMode.All,
          })
        }

        keys(transfers).forEach(id => {
          const { income, outcome } = transfers[id]
          node.transfers.push({
            id,
            income,
            outcome,
            total: EnvActivity.merge(income, outcome),
            keepIncome: keepingEnvelopes.includes(id),
            trMode: TrFilterMode.All,
          })
        })

        keys(debts).forEach(id => {
          const { income, outcome } = debts[id]
          node.debts.push({
            id,
            income,
            outcome,
            total: EnvActivity.merge(income, outcome),
            keepIncome: keepingEnvelopes.includes(id),
            trMode: TrFilterMode.All,
          })
        })

        // Sort
        function compare(a: TSortedActivityNode, b: TSortedActivityNode) {
          return (
            Math.abs(toValue(b.total.total)) - Math.abs(toValue(a.total.total))
          )
        }
        node.incomes.sort(compare)
        node.outcomes.sort(compare)
        node.transfers.sort(compare)
        node.debts.sort(compare)

        // Count totals
        node.incomesTotal = node.incomes.reduce(
          (sum, el) => EnvActivity.merge(sum, el.total),
          new EnvActivity()
        )
        node.outcomesTotal = node.outcomes.reduce(
          (sum, el) => EnvActivity.merge(sum, el.total),
          new EnvActivity()
        )
        node.transfersTotal = node.transfers.reduce(
          (sum, el) => EnvActivity.merge(sum, el.total),
          new EnvActivity()
        )
        node.debtsTotal = node.debts.reduce(
          (sum, el) => EnvActivity.merge(sum, el.total),
          new EnvActivity()
        )

        res[month] = node
      })

      return res
    }
  )

import { createSelector } from '@reduxjs/toolkit'
import { ByMonth, TFxAmount, TISOMonth } from '@shared/types'
import { entries, keys } from '@shared/helpers/keys'
import { TSelector, useAppSelector } from '@store/index'

import { envelopeModel, EnvType, TEnvelopeId } from '@entities/envelope'
import { balances, EnvActivity } from '@entities/envBalances'
import { fxRateModel } from '@entities/currency/fxRate'

// —————————————————————————————————————————————————————————————————————————————
// ACTIVITY BY TYPE
// —————————————————————————————————————————————————————————————————————————————

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
  [balances.rawActivity],
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

export type TInfoNode = {
  id: TEnvelopeId | 'transferFees'
  total: EnvActivity // have to know the value to detect if it is positive
  income?: EnvActivity
  outcome?: EnvActivity
  keepIncome?: boolean
}

type TActivityInfo = {
  incomes: TInfoNode[]
  outcomes: TInfoNode[]
  transfers: TInfoNode[]
  debts: TInfoNode[]
  incomesTotal: EnvActivity
  outcomesTotal: EnvActivity
  transfersTotal: EnvActivity
  debtsTotal: EnvActivity
}

const getActivityInfo = createSelector(
  [getActivityByType, envelopeModel.getKeepingEnvelopes, fxRateModel.converter],
  (activity, keepingEnvelopes, convert) => {
    const res: ByMonth<TActivityInfo> = {}

    keys(activity).forEach(month => {
      const { tags, transfers, debts, internal } = activity[month]
      const toValue = (a: TFxAmount) => convert(a, 'USD', month)

      const node: TActivityInfo = {
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
          const envInfo: TInfoNode = {
            id,
            income,
            outcome,
            keepIncome,
            total: EnvActivity.merge(income, outcome),
          }
          const value = toValue(envInfo.total.total)
          if (value > 0) node.incomes.push(envInfo)
          if (value <= 0) node.outcomes.push(envInfo)
          return
        }
        if (income) {
          node.incomes.push({ id, total: income, income, keepIncome })
        }
        if (outcome) {
          node.outcomes.push({ id, total: outcome, outcome, keepIncome })
        }
      })

      if (toValue(internal.total)) {
        node.transfers.push({
          id: 'transferFees',
          total: internal,
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
        })
      })

      // Sort
      function compare(a: TInfoNode, b: TInfoNode) {
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
    console.log('resss', res)

    return res
  }
)

// —————————————————————————————————————————————————————————————————————————————
// —————————————————————————————————————————————————————————————————————————————

export const useActivityStatsModel = (month: TISOMonth) => {
  return useAppSelector(getActivityInfo)[month]
}

const getActivityInfo2 = createSelector(
  [
    balances.activity,
    envelopeModel.getKeepingEnvelopes,
    envelopeModel.getEnvelopes,
    fxRateModel.converter,
  ],
  (activity, keepingEnvelopes, envelopes, convert) => {
    const res: ByMonth<TActivityInfo> = {}

    keys(activity).forEach(month => {
      const { transferFees, generalIncome, envActivity } = activity[month]
      const toValue = (a: TFxAmount) => convert(a, 'USD', month)

      const node: TActivityInfo = {
        incomes: [],
        outcomes: [],
        transfers: [],
        debts: [],
        incomesTotal: new EnvActivity(),
        outcomesTotal: new EnvActivity(),
        transfersTotal: new EnvActivity(),
        debtsTotal: new EnvActivity(),
      }

      Object.values(envelopes).forEach(env => {
        if (env.type) {
        }
      })

      entries(generalIncome.byEnv).forEach(([id, envActivity]) => {
        const category = getEnvCategory(id)
      })

      // keys(tags).forEach(id => {
      //   const { income, outcome } = tags[id]
      //   const keepIncome = keepingEnvelopes.includes(id)
      //   if (keepIncome) {
      //     const envInfo: TInfoNode = {
      //       id,
      //       income,
      //       outcome,
      //       keepIncome,
      //       total: EnvActivity.merge(income, outcome),
      //     }
      //     const value = toValue(envInfo.total.total)
      //     if (value > 0) node.incomes.push(envInfo)
      //     if (value <= 0) node.outcomes.push(envInfo)
      //     return
      //   }
      //   if (income) {
      //     node.incomes.push({ id, total: income, income, keepIncome })
      //   }
      //   if (outcome) {
      //     node.outcomes.push({ id, total: outcome, outcome, keepIncome })
      //   }
      // })

      // if (toValue(internal.total)) {
      //   node.transfers.push({
      //     id: 'transferFees',
      //     total: internal,
      //   })
      // }

      // keys(transfers).forEach(id => {
      //   const { income, outcome } = transfers[id]
      //   node.transfers.push({
      //     id,
      //     income,
      //     outcome,
      //     total: EnvActivity.merge(income, outcome),
      //     keepIncome: keepingEnvelopes.includes(id),
      //   })
      // })

      // keys(debts).forEach(id => {
      //   const { income, outcome } = debts[id]
      //   node.debts.push({
      //     id,
      //     income,
      //     outcome,
      //     total: EnvActivity.merge(income, outcome),
      //     keepIncome: keepingEnvelopes.includes(id),
      //   })
      // })

      // Sort
      function compare(a: TInfoNode, b: TInfoNode) {
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
    console.log('resss', res)

    return res

    function getEnvCategory(id: TEnvelopeId) {
      const { type } = envelopeModel.parseId(id)
      if (type === EnvType.Tag) return 'tags'
      if (type === EnvType.Account) return 'transfers'
      return 'debts'
    }
  }
)

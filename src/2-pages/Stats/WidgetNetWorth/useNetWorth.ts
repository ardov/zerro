import { useMemo } from 'react'
import { isFinite } from 'lodash'
import { AccountType, TDateDraft, TISODate } from '6-shared/types'
import { GroupBy, toGroup } from '6-shared/helpers/date'
import { keys } from '6-shared/helpers/keys'
import { round } from '6-shared/helpers/money'
import { useAppSelector } from 'store'

import { core } from 'zerro-core/redux'

import { getStart, Period } from '../shared/period'

export type TNetWorthPoint = {
  date: TISODate
  /** Money I gave to somebody */
  lented: number
  /** Money I owe to somebody */
  debts: number
  /** All negative amounts on accounts */
  accountDebts: number
  fundsInBudget: number
  fundsSaving: number
}

export function useNetWorth(
  period: Period,
  aggregation: GroupBy
): TNetWorthPoint[] {
  const accs = core.accounts.usePopulated()

  return useDisplayBalances(aggregation, getStart(period, aggregation)).map(
    ({ date, balances }) => {
      const { accounts, debtors } = balances

      let lented = 0
      let debts = 0
      keys(debtors).forEach(id => {
        console.assert(
          isFinite(debtors[id]),
          `debtors[${id}] is not a number`,
          debtors[id],
          date
        )
        const value = debtors[id] || 0
        if (value > 0) lented = round(lented + value)
        if (value < 0) debts = round(debts + value)
      })

      let fundsInBudget = 0
      let fundsSaving = 0
      let accountDebts = 0
      keys(accounts).forEach(id => {
        if (accs[id].type === AccountType.Debt) return
        console.assert(
          isFinite(accounts[id]),
          `accounts[${id}] is not a number`,
          accounts[id],
          date
        )
        const value = accounts[id] || 0
        if (value > 0) {
          if (accs[id]?.inBudget) {
            fundsInBudget = round(fundsInBudget + value)
          } else {
            fundsSaving = round(fundsSaving + value)
          }
        }
        if (value < 0) {
          accountDebts = round(accountDebts + value)
        }
      })

      return { date, lented, debts, fundsInBudget, fundsSaving, accountDebts }
    }
  )
}

type TBalanceNode = core.balances.TBalanceNode

function useDisplayBalances(
  aggregation: GroupBy,
  start?: TDateDraft,
  end?: TDateDraft
) {
  const list = useAppSelector(core.balances.selectByDate)
  const startDate = toGroup(start || list[0].date, aggregation)
  // eslint-disable-next-line react-hooks/purity -- 'today' is intentionally sampled on render
  const endDate = toGroup(end || Date.now(), aggregation)
  const fxBalances = useMemo(() => {
    const byGroup: Record<TISODate, TBalanceNode> = {}
    list.forEach(node => {
      const date = toGroup(node.date, aggregation)
      if (date < startDate || date > endDate) return
      byGroup[date] = { date, balances: node.balances }
    })
    return keys(byGroup)
      .sort()
      .map(group => byGroup[group])
  }, [aggregation, endDate, list, startDate])

  const convert = useAppSelector(core.currency.selectDisplayConverter)
  return useMemo(
    () => core.balances.convertToDisplay(fxBalances, convert),
    [convert, fxBalances]
  )
}

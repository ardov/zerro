import { AccountType, TISODate } from '6-shared/types'
import { GroupBy } from '6-shared/helpers/date'
import { keys } from '6-shared/helpers/keys'
import { round } from '6-shared/helpers/money'

import { accountModel } from '5-entities/account'
import { accBalanceModel } from '5-entities/accBalances'
import { getStart, Period } from '../shared/period'
import { isFinite } from 'lodash'

export type TPoint = {
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

export function useNetWorth(period: Period, aggregation: GroupBy) {
  const accs = accountModel.usePopulatedAccounts()

  let p: Array<TPoint> = accBalanceModel
    .useDisplayBalances(aggregation, getStart(period, aggregation))
    .map(({ date, balances }) => {
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
    })
  return p
}

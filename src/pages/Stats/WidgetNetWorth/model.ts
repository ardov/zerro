import { GroupBy } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'
import { AccountType, TISODate } from '@shared/types'

import { accountModel } from '@entities/account'
import { accBalanceModel } from '@entities/accBalances'
import { getStart, Period } from '../shared/period'
import { round } from '@shared/helpers/money'

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
        if (debtors[id] > 0) lented = round(lented + debtors[id])
        if (debtors[id] < 0) debts = round(debts + debtors[id])
      })

      let fundsInBudget = 0
      let fundsSaving = 0
      let accountDebts = 0
      keys(accounts).forEach(id => {
        if (accs[id].type === AccountType.Debt) return
        if (accounts[id] > 0) {
          if (accs[id]?.inBudget) {
            fundsInBudget = round(fundsInBudget + accounts[id])
          } else {
            fundsSaving = round(fundsSaving + accounts[id])
          }
        }
        if (accounts[id] < 0) {
          accountDebts = round(accountDebts + accounts[id])
        }
      })

      return { date, lented, debts, fundsInBudget, fundsSaving, accountDebts }
    })
  return p
}

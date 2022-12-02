import { accountModel } from '@entities/account'
import { displayCurrency } from '@entities/currency/displayCurrency'
import { GroupBy, toGroup } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'
import { round } from '@shared/helpers/money'
import { TISODate } from '@shared/types'
import { useAppSelector } from '@store/index'
import { balanceModel } from '../accBalances'
import { getStart, Period } from '../shared/period'

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
  const balances = useAppSelector(balanceModel.getBalancesByDate)
  const toDisplay = displayCurrency.useToDisplay('current')
  const accs = accountModel.usePopulatedAccounts()

  let points: TPoint[] = []
  let startGroup = getStart(period, aggregation)
  let lastAdded: TISODate | null = null
  reverse(balances).forEach(({ date, balances }) => {
    const group = toGroup(date, aggregation)
    const { accounts, debtors } = balances
    if (group < startGroup) return // Out of period
    if (group === lastAdded) return // Already added

    let lented = 0
    let debts = 0
    keys(debtors).forEach(debtorId => {
      let balance = toDisplay(debtors[debtorId])
      if (balance > 0) {
        lented = round(lented + balance)
      }
      if (balance < 0) {
        debts = round(debts + balance)
      }
    })

    let fundsInBudget = 0
    let fundsSaving = 0
    let accountDebts = 0
    keys(accounts).forEach(accId => {
      let balance = toDisplay(accounts[accId])
      if (balance > 0) {
        if (accs[accId]?.inBudget) {
          fundsInBudget = round(fundsInBudget + balance)
        } else {
          fundsSaving = round(fundsSaving + balance)
        }
      }
      if (balance < 0) {
        accountDebts = round(accountDebts + balance)
      }
    })

    points.push({
      date: group,
      lented,
      debts,
      fundsInBudget,
      fundsSaving,
      accountDebts,
    })

    lastAdded = group
  })

  return reverse(points) // Oldest first
}

function reverse<T>(arr: T[]): T[] {
  return [...arr].reverse()
}

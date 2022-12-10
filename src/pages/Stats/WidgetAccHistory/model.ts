import { accountModel } from '@entities/account'
import { GroupBy } from '@shared/helpers/date'
import { TAccountId, TISODate } from '@shared/types'
import { useAppSelector } from '@store/index'
import { accBalanceModel } from '@entities/accBalances'
import { getStart, Period } from '../shared/period'

export type TPoint = {
  date: TISODate
  balance: number
}

export function useAccountHistory(id: TAccountId, period: Period) {
  const account = accountModel.usePopulatedAccounts()[id]
  const balances = useAppSelector(accBalanceModel.getBalancesByDate)
  const currency = account.fxCode
  const firstDate = getStart(period, GroupBy.Day)
  return balances
    .map(({ date, balances }) => {
      return {
        date,
        balance: balances.accounts?.[id]?.[currency] || 0,
      }
    })
    .filter(point => point.date >= firstDate)
}

import { accountModel } from '@entities/account'
import { GroupBy } from '@shared/helpers/date'
import { TAccountId, TISODate } from '@shared/types'
import { accBalanceModel } from '@entities/accBalances'
import { getStart, Period } from '../shared/period'

export type TPoint = {
  date: TISODate
  balance: number
}

export function useAccountHistory(id: TAccountId, period: Period) {
  let balances: TPoint[] = accBalanceModel
    .useDisplayBalances(GroupBy.Day, getStart(period, GroupBy.Day))
    .map(({ date, balances }) => {
      return {
        date,
        balance: balances.accounts?.[id] || 0,
      }
    })
  return balances
}

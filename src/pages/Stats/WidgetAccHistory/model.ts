import { GroupBy } from '@shared/helpers/date'
import { TAccountId, TISODate } from '@shared/types'
import { accBalanceModel } from '@entities/accBalances'
import { getStart, Period } from '../shared/period'
import { accountModel } from '@entities/account'

export type TPoint = {
  date: TISODate
  balance: number
}

export function useAccountHistory(id: TAccountId, period: Period) {
  let acc = accountModel.usePopulatedAccounts()[id]
  let balances: TPoint[] = accBalanceModel
    .useBalances(GroupBy.Day, getStart(period, GroupBy.Day))
    .map(({ date, balances }) => {
      return {
        date,
        balance: balances.accounts?.[id]?.[acc.fxCode] || 0,
      }
    })
  return balances
}

import { GroupBy } from '6-shared/helpers/date'
import { TAccountId, TISODate } from '6-shared/types'
import { accBalanceModel } from '5-entities/accBalances'
import { getStart, Period } from '../shared/period'
import { accountModel } from '5-entities/account'
import { useAppSelector } from 'store/index'
import { useMemo } from 'react'

export type TPoint = {
  date: TISODate
  balance: number
}

export function useAccountHistory(id: TAccountId, period: Period) : TPoint[] {
  let { fxCode } = accountModel.usePopulatedAccounts()[id]

  let allBalances = useAppSelector(accBalanceModel.getBalancesByDate)

  return useMemo(() => {
    const firstDate = getStart(period, GroupBy.Day)
    const filtered = firstDate
      ? allBalances.filter(({ date }) => date >= firstDate!)
      : allBalances

    return filtered.map(({ date, balances }) => ({
      date,
      balance: balances.accounts?.[id]?.[fxCode] || 0,
    }))
  }, [allBalances, period, fxCode, id])
}

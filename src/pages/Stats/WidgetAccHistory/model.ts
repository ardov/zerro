import { GroupBy } from '@shared/helpers/date'
import { TAccountId, TISODate } from '@shared/types'
import { accBalanceModel } from '@entities/accBalances'
import { getStart, Period } from '../shared/period'
import { accountModel } from '@entities/account'
import { useAppSelector } from '@store/index'
import { useMemo } from 'react'

export type TPoint = {
  date: TISODate
  balance: number
}

export function useAccountHistory(id: TAccountId, period: Period) {
  let { fxCode } = accountModel.usePopulatedAccounts()[id]

  let allBalances = useAppSelector(accBalanceModel.getBalancesByDate)

  const balances = useMemo(() => {
    const firstDate = getStart(period, GroupBy.Day)
    const filtered = firstDate
      ? allBalances.filter(({ date }) => date >= firstDate!)
      : allBalances

    return filtered.map(({ date, balances }) => ({
      date,
      balance: balances.accounts?.[id]?.[fxCode] || 0,
    }))
  }, [allBalances, period, fxCode, id])

  return balances
}

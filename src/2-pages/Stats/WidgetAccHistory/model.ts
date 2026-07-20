import { GroupBy } from '6-shared/helpers/date'
import { TAccountId, TISODate } from '6-shared/types'
import { core } from 'zerro-core/redux'

import { getStart, Period } from '../shared/period'
import { useAppSelector } from 'store/index'
import { useMemo } from 'react'

export type TPoint = {
  date: TISODate
  balance: number
}

export function useAccountHistory(id: TAccountId, period: Period): TPoint[] {
  const { fxCode } = core.accounts.usePopulated()[id]

  const allBalances = useAppSelector(core.balances.selectByDate)

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

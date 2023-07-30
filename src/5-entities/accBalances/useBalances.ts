import { useMemo } from 'react'
import { TDateDraft, TISODate } from '6-shared/types'
import { GroupBy, toGroup } from '6-shared/helpers/date'
import { keys } from '6-shared/helpers/keys'

import { useAppSelector } from 'store/index'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { balancesToDisplay } from './shared/convertBalancesToDisplay'
import { TBalanceNode } from './shared/types'
import { getBalancesByDate } from './getBalancesByDate'

export function useBalances(
  aggregation: GroupBy,
  start?: TDateDraft,
  end?: TDateDraft
) {
  const list = useAppSelector(getBalancesByDate)
  const startDate = toGroup(start || list[0].date, aggregation)
  const endDate = toGroup(end || Date.now(), aggregation)
  const balances = useMemo(() => {
    let byGroup: Record<TISODate, TBalanceNode> = {}
    list.forEach(node => {
      let date = toGroup(node.date, aggregation)
      if (date < startDate || date > endDate) return
      byGroup[date] = { date, balances: node.balances }
    })
    return keys(byGroup)
      .sort()
      .map(group => byGroup[group])
  }, [aggregation, endDate, list, startDate])

  return balances
}

export function useDisplayBalances(
  aggregation: GroupBy,
  start?: TDateDraft,
  end?: TDateDraft
) {
  const fxBalances = useBalances(aggregation, start, end)
  const convert = useAppSelector(displayCurrency.getConverter)
  const balances = useMemo(
    () => balancesToDisplay(fxBalances, convert),
    [convert, fxBalances]
  )
  return balances
}

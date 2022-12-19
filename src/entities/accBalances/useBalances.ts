import { useMemo } from 'react'
import { TDateDraft, TISODate } from '@shared/types'
import {
  GroupBy,
  makeDateArray,
  toGroup,
  toISODate,
} from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'

import { useAppSelector } from '@store/index'

import { getBalances, TBalanceState } from './getBalances'
import { getDisplayBalancesByDate } from './getBalancesByDate'

export function useBalances(
  aggregation: GroupBy,
  start?: TDateDraft,
  end?: TDateDraft
) {
  const { byDay, startingBalances } = useAppSelector(getBalances)

  const balances = useMemo(() => {
    let firstDate = getStartDate(start, byDay)
    return makeDateArray(firstDate, end || Date.now(), aggregation).map(
      date => {
        return {
          date,
          balances: findBalances(date, aggregation),
        }
      }
    )

    function findBalances(date: TISODate, aggregation: GroupBy) {
      let key = keys(byDay)
        .sort()
        .reverse()
        .find(key => toGroup(key, aggregation) <= date)
      return key ? byDay[key] : startingBalances
    }
  }, [aggregation, byDay, end, start, startingBalances])

  return balances
}

const firstReasonableDate = '2000-01-01'
function getStartDate(
  date: TDateDraft | undefined,
  byDay: Record<TISODate, TBalanceState>
) {
  if (date) return date
  let firstKey = keys(byDay)
    .sort()
    .find(d => d >= firstReasonableDate)
  return firstKey || toISODate(Date.now())
}

export function useDisplayBalances(
  aggregation: GroupBy,
  start?: TDateDraft,
  end?: TDateDraft
) {
  const list = useAppSelector(getDisplayBalancesByDate)

  const balances = useMemo(() => {
    let newFirst = [...list].reverse()

    let firstDate =
      start ||
      (list[0].date >= firstReasonableDate ? list[0].date : firstReasonableDate)
    return makeDateArray(firstDate, end || Date.now(), aggregation).map(
      date => {
        return {
          date,
          balances: findBalances(date, aggregation),
        }
      }
    )

    function findBalances(date: TISODate, aggregation: GroupBy) {
      let key =
        newFirst.find(s => toGroup(s.date, aggregation) <= date) || list[0]
      return key.balances
    }
  }, [aggregation, end, list, start])

  return balances
}

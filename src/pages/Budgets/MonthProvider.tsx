import React, { FC, ReactNode, useCallback, useEffect, useState } from 'react'
import { TDateDraft, TISOMonth } from '@shared/types'
import { isISOMonth, toISOMonth } from '@shared/helpers/date'
import { balances } from '@entities/envBalances'

type TMonthState = [TISOMonth, (date: TDateDraft) => void]

const MonthContext = React.createContext<TMonthState>([
  toISOMonth(new Date()),
  () => {},
])

export function useMonth() {
  return React.useContext(MonthContext)
}

export const MonthProvider: FC<{ children: ReactNode }> = props => {
  const currentMonth = toISOMonth(new Date())
  const monthList = balances.useMonthList()
  const firstMonth = monthList.at(0) || currentMonth
  const lastMonth = monthList.at(-1) || currentMonth
  const [month, setMonth] = useState<TISOMonth>(currentMonth)
  const setNewMonth = useCallback(
    (date: TDateDraft) =>
      setMonth(prev => {
        if (!date) return prev
        const next = toISOMonth(date)
        if (!isISOMonth(next)) return prev
        if (next < firstMonth) return firstMonth
        if (next > lastMonth) return lastMonth
        return next
      }),
    [firstMonth, lastMonth]
  )

  // Put month into boundaries when they changes
  useEffect(() => {
    setMonth(current => {
      if (current < firstMonth) return firstMonth
      if (current > lastMonth) return lastMonth
      return current
    })
  }, [firstMonth, lastMonth])

  return (
    <MonthContext.Provider value={[month, setNewMonth]}>
      {props.children}
    </MonthContext.Provider>
  )
}

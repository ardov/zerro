import React, { FC, ReactNode, useCallback, useState } from 'react'
import { TDateDraft, TISOMonth } from '@shared/types'
import { isISOMonth, toISOMonth } from '@shared/helpers/date'
import { balances } from '@entities/envBalances'

type TMonthState = [TISOMonth, (date: TDateDraft) => void]

const MonthContext = React.createContext<TMonthState>([
  toISOMonth(new Date()),
  () => {},
])

export const useMonth = () => React.useContext(MonthContext)

export const MonthProvider: FC<{ children: ReactNode }> = props => {
  const currentMonth = toISOMonth(new Date())
  const monthList = balances.useMonthList()
  const firstMonth = monthList[0] || currentMonth
  const lastMonth = monthList[monthList.length - 1] || currentMonth
  const [selected, setSelected] = useState<TISOMonth>(currentMonth)

  const setNewMonth = useCallback(
    (date: TDateDraft) =>
      setSelected(prev => {
        if (!date) return prev
        const next = toISOMonth(date)
        if (!isISOMonth(next)) return prev
        return getValidMonth(next, firstMonth, lastMonth)
      }),
    [firstMonth, lastMonth]
  )

  const month = getValidMonth(selected, firstMonth, lastMonth)

  return (
    <MonthContext.Provider value={[month, setNewMonth]}>
      {props.children}
    </MonthContext.Provider>
  )
}

/** Returns a month within given range */
function getValidMonth(selected: TISOMonth, min: TISOMonth, max: TISOMonth) {
  if (selected < min) return min
  if (selected > max) return max
  return selected
}

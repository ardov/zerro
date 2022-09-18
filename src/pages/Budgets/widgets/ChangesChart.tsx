import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { useTheme } from '@mui/material'
import { prevMonth, toISODate, toISOMonth } from '@shared/helpers/date'
import { TEnvelopeId, TFxAmount, TISODate, TISOMonth } from '@shared/types'
import { add, convertFx, sub } from '@shared/helpers/money'
import { useAppSelector } from '@store/index'
import { getTotalChanges, useRates } from '@entities/envelopeData'
import { useDisplayCurrency } from '@entities/instrument/hooks'
import { useMonth } from '@shared/hooks/useMonth'

type ChartProps = {
  mode: 'balance' | 'outcome' | 'income'
  id?: TEnvelopeId
}

export function ChangesChart(props: ChartProps) {
  const { mode, id } = props
  const [month] = useMonth()
  const trend = useDoubleTrend(month, id)
  const theme = useTheme()

  const key = {
    balance: { curr: 'balance', prev: 'prevBalance' },
    outcome: { curr: 'totalOutcome', prev: 'prevTotalOutcome' },
    income: { curr: 'totalIncome', prev: 'prevTotalIncome' },
  }

  return (
    <ResponsiveContainer height={120}>
      <LineChart data={trend} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey={key[mode].prev}
          dot={false}
          stroke={theme.palette.primary.main}
          strokeWidth={0.5}
        />
        <Line
          type="monotone"
          dataKey={key[mode].curr}
          dot={false}
          stroke={theme.palette.primary.main}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function useDoubleTrend(month: TISOMonth, id?: TEnvelopeId) {
  const monthPrev = toISOMonth(prevMonth(month))
  const currTrend = useDataTrend(month, id)
  const prevTrend = useDataTrend(monthPrev, id)
  return currTrend.map((node, i) => {
    const prev = prevTrend[i] || {}
    return {
      ...node,
      prevDate: prev.date || null,
      prevBalance: prev.balance || null,
      prevTotalIncome: prev.totalIncome || null,
      prevTotalOutcome: prev.totalOutcome || null,
    }
  })
}

type TTrendNode = {
  day: number
  date: TISODate | null
  balance: number | null
  totalIncome: number | null
  totalOutcome: number | null
}

function useDataTrend(month: TISOMonth, id?: TEnvelopeId): TTrendNode[] {
  const displayCurrency = useDisplayCurrency()
  const rates = useRates(month)
  const toDisplay = (a: TFxAmount) => convertFx(a, displayCurrency, rates)
  const changes = useAppSelector(getTotalChanges)[month]
  if (!changes) return []

  const node = id ? changes.byEnvelope[id] : changes.sum
  const { trend, trendIncome, trendOutcome } = node

  const currDate = toISODate(new Date())
  let balance = 0
  let totalIncome = 0
  let totalOutcome = 0

  const result: TTrendNode[] = trend.map((_, i) => {
    balance = add(balance, toDisplay(trend[i]))
    totalIncome = add(totalIncome, toDisplay(trendIncome[i]))
    totalOutcome = sub(totalOutcome, toDisplay(trendOutcome[i]))
    const date = getDate(i + 1)

    if (!date || currDate < date) {
      return {
        day: i,
        date: null,
        balance: null,
        totalIncome: null,
        totalOutcome: null,
      }
    }

    return { day: i, date, balance, totalIncome, totalOutcome }
  })

  return result

  function getDate(day: number) {
    const isoDate = (month + '-' + day.toString().padStart(2, '0')) as TISODate
    const isValid = new Date(isoDate).toString() !== 'Invalid Date'
    return isValid ? isoDate : null
  }
}

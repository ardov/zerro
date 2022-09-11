import { getMonthTotals, getTotalChanges } from '@entities/envelopeData'
import { useDisplayCurrency } from '@entities/instrument/hooks'
import { Divider, Paper, Stack } from '@mui/material'
import { prevMonth, toISOMonth } from '@shared/helpers/date'
import { convertFx } from '@shared/helpers/money'
import { TFxAmount, TISOMonth } from '@shared/types'
import { DataLine } from '@shared/ui/DataLine'
import { useAppSelector } from '@store/index'
import { FC } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
} from 'recharts'
import { BalanceWidget } from './BalanceWidget'
import { Explainer } from './Explainer'
import { StatWidget } from './StatWidget'

export const BalanceInfo: FC<{ month: TISOMonth }> = props => {
  const changes = useAppSelector(getTotalChanges)[props.month]
  const changesPrev =
    useAppSelector(getTotalChanges)[toISOMonth(prevMonth(props.month))]
  const totals = useAppSelector(getMonthTotals)[props.month]
  const displayCurrency = useDisplayCurrency()
  const { rates } = totals
  const toDisplay = (a: TFxAmount) => convertFx(a, displayCurrency, rates)

  let currDay =
    toISOMonth(new Date()) === props.month ? new Date().getDate() : null

  let diff = 0
  let outcome = 0
  let outcomePrev = 0
  const data = changes.sum.trend.map((v, i) => {
    diff += toDisplay(v)
    outcome += toDisplay(changes.sum.trendOutcome[i])
    outcomePrev += toDisplay(changesPrev.sum.trendOutcome[i])
    if (currDay && i + 1 > currDay) {
      return {
        day: i + 1,
        diff: null,
        income: null,
        outcome: null,
        outcomePrev: outcomePrev,
      }
    }
    return {
      day: i + 1,
      diff: diff,
      income: toDisplay(changes.sum.trendIncome[i]),
      outcome: outcome,
      outcomePrev: outcomePrev,
    }
  })

  return (
    <Stack gap={2}>
      <BalanceWidget month={props.month} />
      <StatWidget month={props.month} mode="income" />
      <StatWidget month={props.month} mode="outcome" />
      {/*  */}

      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Chart data={data} />

        <Divider />

        <Explainer month={props.month} />

        <Divider />

        <DataLine
          name="Всего в бюджете"
          amount={toDisplay(totals.fundsEnd)}
          currency={displayCurrency}
        />
        <DataLine
          name="За месяц"
          amount={toDisplay(totals.fundsChange)}
          currency={displayCurrency}
          sign
        />
        <DataLine
          name="Доходы"
          amount={toDisplay(changes.sum.totalIncome)}
          currency={displayCurrency}
          sign
        />
        <DataLine
          name="Расходы"
          amount={toDisplay(changes.sum.totalOutcome)}
          currency={displayCurrency}
          sign
        />
        <DataLine
          name="Комиссии/обмен"
          amount={toDisplay(changes.transferFees.total)}
          currency={displayCurrency}
          sign
        />

        <Divider />

        <DataLine
          name="Распределено"
          amount={toDisplay(totals.available)}
          currency={displayCurrency}
        />
        <DataLine
          name="Распределено в будущем"
          amount={toDisplay(totals.budgetedInFuture)}
          currency={displayCurrency}
        />
        <DataLine
          name="Свободно"
          amount={toDisplay(totals.toBeBudgetedFx)}
          currency={displayCurrency}
        />
      </Paper>
    </Stack>
  )
}

function Chart(props: any) {
  return (
    <LineChart width={270} height={100} data={props.data}>
      <Line
        type="monotone"
        dataKey="outcome"
        dot={false}
        stroke="#8884d8"
        strokeWidth={2}
      />
      <Line
        type="monotone"
        dataKey="outcomePrev"
        dot={false}
        stroke="#8884d8"
        strokeWidth={0.5}
      />
      {/* <Line type="monotone" dataKey="diff" stroke="#8884d8" strokeWidth={2} /> */}
      {/* <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" /> */}
    </LineChart>
  )
}

import React from 'react'
import { Paper, Card, Typography, Box } from '@mui/material'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useAppTheme } from '@shared/ui/theme'
import { formatMoney } from '@shared/helpers/money'
import { formatDate, parseDate } from '@shared/helpers/date'
import { TISODate } from '@shared/types'
import { displayCurrency } from '@entities/currency/displayCurrency'
import { DataLine } from 'widgets/DataLine'
import { useCashFlow } from './model'
import { Period, periodTitles } from '../shared/period'

type Point = {
  date: TISODate
  income: number
  outcome: number
}

type WidgetCashflowProps = {
  period: Period
  onTogglePeriod: () => void
}

export function WidgetCashflow(props: WidgetCashflowProps) {
  const { period, onTogglePeriod } = props
  const theme = useAppTheme()
  const points = useCashFlow(period)

  const colorIncome = theme.palette.success.main
  const colorOutcome = theme.palette.error.main
  const colorAxisText = theme.palette.text.disabled

  return (
    <Paper>
      <Box p={2} minWidth="100%">
        <Typography variant="h5">
          Доходы и расходы{' '}
          <span
            style={{ color: theme.palette.secondary.main, cursor: 'pointer' }}
            onClick={onTogglePeriod}
          >
            {periodTitles[period]}
          </span>
        </Typography>
      </Box>

      <ResponsiveContainer height={300}>
        <AreaChart data={points}>
          <defs>
            <linearGradient id="areaIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorIncome} stopOpacity={0.4} />
              <stop offset="95%" stopColor={colorIncome} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="areaOut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorOutcome} stopOpacity={0.4} />
              <stop offset="95%" stopColor={colorOutcome} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            dataKey="income"
            name="Доход"
            stroke={colorIncome}
            fill="url(#areaIn)"
          />
          <Area
            dataKey="outcome"
            name="Расход"
            stroke={colorOutcome}
            fill="url(#areaOut)"
          />
          <XAxis
            dataKey="date"
            tickFormatter={tickFormatter}
            axisLine={false}
            tickLine={false}
            tickMargin={2}
            stroke={colorAxisText}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={number => formatMoney(number, undefined, 0)}
            axisLine={false}
            tickLine={false}
            tickMargin={2}
            stroke={colorAxisText}
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <CartesianGrid opacity={0.5} vertical={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  )
}

type TPayload = {
  // chartType: undefined
  color: string
  dataKey: string
  fill: string
  // formatter: undefined
  name: string
  payload: Point
  // type: undefined
  // unit: undefined
  value: number
}

const CustomTooltip = (props: any) => {
  const [currency] = displayCurrency.useDisplayCurrency()
  const payload = props.payload as TPayload[]
  const active = props.active as boolean
  if (!active || !payload?.length) return null
  const date = payload[0]?.payload?.date

  const diff = payload[0].payload.income - payload[0].payload.outcome

  return (
    <Card elevation={10} sx={{ p: 2 }}>
      <Typography variant="h6">
        {capitalize(formatDate(date, 'LLLL yyyy'))}
      </Typography>
      {payload.map(v => (
        <DataLine
          color={v.color}
          key={v.dataKey}
          name={v.name}
          amount={v.value}
          currency={currency}
        />
      ))}
      <DataLine
        color="transparent"
        name={diff < 0 ? 'Чистый расход' : 'Чистый доход'}
        amount={diff}
        currency={currency}
      />
    </Card>
  )
}

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function tickFormatter(date: TISODate) {
  return parseDate(date).getMonth() === 0
    ? formatDate(date, 'yyyy')
    : formatDate(date, 'LLL').toUpperCase().replace('.', '')
}

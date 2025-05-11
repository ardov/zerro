import React from 'react'
import { useTranslation } from 'react-i18next'
import { Paper, Card, Typography, Box, Divider } from '@mui/material'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useAppTheme } from '6-shared/ui/theme'
import { formatMoney } from '6-shared/helpers/money'
import { formatDate, parseDate } from '6-shared/helpers/date'
import { TISODate } from '6-shared/types'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { DataLine } from '3-widgets/DataLine'
import { useCashFlow } from '../shared/cashflow'
import { Period, PeriodTitle } from '../shared/period'

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
  const { t } = useTranslation('analytics')
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
          {t('incomesAndOutcomes')}{' '}
          <span
            style={{ color: theme.palette.secondary.main, cursor: 'pointer' }}
            onClick={onTogglePeriod}
          >
            <PeriodTitle period={period} />
          </span>
        </Typography>
      </Box>

      <ResponsiveContainer height={300} style={{ paddingRight: '16px' }}>
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
            name={t('income')}
            stroke={colorIncome}
            fill="url(#areaIn)"
          />
          <Area
            dataKey="outcome"
            name={t('outcome')}
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
            domain={[0, 'dataMax']}
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
  const { t } = useTranslation('analytics')
  const [currency] = displayCurrency.useDisplayCurrency()
  const payload = props.payload as TPayload[]
  const active = props.active as boolean
  if (!active || !payload?.length) return null
  const date = payload[0]?.payload?.date

  const diff = payload[0].payload.income - payload[0].payload.outcome
  const income = payload[0].payload.income
  const savingsRate = income > 0 ? (diff / income * 100) : 0

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
      <Divider sx={{ my: 1 }} />
      <DataLine
        color="transparent"
        name={t(diff < 0 ? 'netOutcome' : 'netIncome')}
        amount={diff}
        currency={currency}
      />
      <DataLine
        color="transparent"
        name={t('savingsRate')}
        amount={savingsRate}
        currency="%"
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

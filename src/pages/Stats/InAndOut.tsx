import React, { useState } from 'react'
import { useAppSelector } from 'models'
import { Paper, Card, Typography, Box, useTheme } from '@mui/material'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { DataLine } from 'shared/ui/DataLine'
import { getHistoryStart, getTransactionsHistory } from 'models/transactions'
import { formatDate, formatMoney } from 'shared/helpers/format'
import { makeDateArray, monthStart } from 'shared/helpers/date'
import { convertCurrency } from 'models/instruments'
import { round } from 'shared/helpers/currencyHelpers'
import { getType } from 'models/transactions/helpers'

type Point = {
  date: Date
  in: number
  out: number
}

export function InAndOut() {
  const theme = useTheme()
  const transactions = useAppSelector(getTransactionsHistory)
  const convert = useAppSelector(convertCurrency)
  const historyStart = useAppSelector(getHistoryStart)
  const [filterMode, setFilterMode] = useState<'lastYear' | 'all'>('lastYear')

  let points: Point[] = makeDateArray(historyStart).map(date => ({
    date,
    in: 0,
    out: 0,
  }))

  transactions.forEach(tr => {
    const trType = getType(tr)
    if (trType === 'transfer') return
    const date = new Date(tr.date)
    const monthDate = monthStart(date)
    const monthNode = points.find(node => +node.date === +monthDate)
    if (!monthNode) return
    if (trType === 'income') {
      monthNode.in = round(
        monthNode.in + convert(tr.income, tr.incomeInstrument)
      )
    }
    if (trType === 'outcome') {
      monthNode.out = round(
        monthNode.out + convert(tr.outcome, tr.outcomeInstrument)
      )
    }
  })

  points = points.map((node, i, arr) => {
    const num = 1
    const first = i - num >= 0 ? i - num : 0
    const array = arr.slice(first + 1, i + 1)
    const result = {
      ...node,
      in: array.reduce((sum, node) => sum + node.in, 0) / array.length,
      out: array.reduce((sum, node) => sum + node.out, 0) / array.length,
    }
    return result
  })

  if (filterMode === 'lastYear') {
    points = points.slice(-12)
  }

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
            onClick={() => {
              setFilterMode(mode => (mode === 'all' ? 'lastYear' : 'all'))
            }}
          >
            {filterMode === 'all' ? 'за всё время' : 'за год'}
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
            dataKey="in"
            name="Доход"
            stroke={colorIncome}
            fill="url(#areaIn)"
          />
          <Area
            dataKey="out"
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
  const payload = props.payload as TPayload[]
  const active = props.active as boolean
  if (!active || !payload?.length) return null
  const date = payload[0]?.payload?.date

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
          instrument="user"
        />
      ))}
      <DataLine
        color="transparent"
        name={'Чистый доход'}
        amount={payload[0].payload.in - payload[0].payload.out}
        instrument="user"
      />
    </Card>
  )
}

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function tickFormatter(date: Date) {
  return date?.getMonth() === 0
    ? formatDate(date, 'yyyy')
    : formatDate(date, 'LLL').toUpperCase().replace('.', '')
}

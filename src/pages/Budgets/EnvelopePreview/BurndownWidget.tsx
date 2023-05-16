import React, { FC, useState } from 'react'
import { Area, ComposedChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { Stack, Box, BoxProps } from '@mui/material'
import { DataLine } from '@components/DataLine'
import { formatDate } from '@shared/helpers/date'

import { useAppTheme } from '@shared/ui/theme'
import { prevMonth, toISODate, toISOMonth } from '@shared/helpers/date'
import { TISODate, TISOMonth } from '@shared/types'
import { addFxAmount, round } from '@shared/helpers/money'

import { balances } from '@entities/envBalances'
import { TEnvelopeId } from '@entities/envelope'
import { displayCurrency } from '@entities/currency/displayCurrency'
import { useMonth } from '../MonthProvider'

type BurndownWidgetProps = BoxProps & { id: TEnvelopeId }

export const BurndownWidget: FC<BurndownWidgetProps> = ({
  id,
  ...boxProps
}) => {
  const [month, setMonth] = useMonth()
  const [highlighted, setHighlighted] = useState(month)
  const envData = balances.useEnvData()
  const { currency } = envData[month][id]

  const theme = useAppTheme()
  const activityColor = theme.palette.primary.main

  const StartingAmountTooltip = (
    <Stack spacing={0.5}>
      <DataLine
        name="Бюджет в этом месяце"
        // amount={selectedData?.budgeted}
        amount={0}
        currency={currency}
      />
      <DataLine
        name="Остаток с прошлого месяца"
        // amount={selectedData?.leftover}
        amount={0}
        currency={currency}
      />
    </Stack>
  )

  const onMouseMove = (e: any) => {
    if (e?.activeLabel && e.activeLabel !== highlighted) {
      setHighlighted(e.activeLabel)
    }
  }
  const onClick = (e: any) => {
    if (e?.activeLabel && e.activeLabel !== month) {
      setMonth(e.activeLabel)
    }
  }

  return (
    <Box borderRadius={1} bgcolor="background.default" {...boxProps}>
      <Stack spacing={0.5} pt={2} px={2}>
        <DataLine
          name={`Баланс на ${formatDate(month, 'LLL')}`}
          // color={activityColor}
          // amount={selectedData?.activity}
          // amount={0}
          currency={currency}
          tooltip={
            'Сплошная линия показывает изменение баланса в этом месяце. Пунктирная — в прошлом.'
          }
        />
      </Stack>

      <Box width="100%" height="160px">
        <ChangesChart month={month} id={id} />
      </Box>
    </Box>
  )
}

type ChartProps = {
  month: TISOMonth
  id: TEnvelopeId
}

export function ChangesChart(props: ChartProps) {
  const { id, month } = props
  const trend = useDoubleTrend(month, id)
  const theme = useAppTheme()

  console.log('trend', trend)

  return (
    <ResponsiveContainer>
      <ComposedChart
        data={trend}
        margin={{ top: 8, right: 16, left: 16, bottom: 16 }}
      >
        <Line
          type="monotone"
          dataKey="balance"
          dot={false}
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="prevBalance"
          dot={false}
          stroke={theme.palette.primary.main}
          strokeWidth={0.5}
          strokeDasharray="2 3"
          isAnimationActive={false}
        />

        <Area
          type="monotone"
          dataKey="burndown"
          dot={false}
          fill={theme.palette.primary.main}
          fillOpacity={0.1}
          strokeWidth={0}
          isAnimationActive={false}
        />
        <YAxis domain={['dataMin', 'dataMax']} hide />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function useDoubleTrend(month: TISOMonth, id: TEnvelopeId) {
  const monthPrev = toISOMonth(prevMonth(month))
  const currTrend = useDataTrend(month, id)
  const prevTrend = useDataTrend(monthPrev, id)
  const startValue = currTrend[0].balance || 0
  const lastaDayInMonth = getMonthLength(month)
  const trend = currTrend.map((node, i) => {
    const prev = prevTrend[i] || {}
    const burndown = round(startValue - (startValue / lastaDayInMonth) * i)
    return {
      ...node,
      prevDate: prev.date || null,
      prevBalance: prev.balance || null,
      burndown: burndown < 0 ? null : burndown,
    }
  })
  trend.splice(lastaDayInMonth, trend.length - lastaDayInMonth)
  return trend
}

function getMonthLength(month: TISOMonth) {
  const year = month.slice(0, 4)
  const monthNum = Number(month.slice(5, 7))
  return new Date(Number(year), monthNum, 0).getDate()
}

type TTrendNode = {
  day: number
  date: TISODate | null
  balance: number | null
}

function useDataTrend(month: TISOMonth, id: TEnvelopeId): TTrendNode[] {
  const toDisplay = displayCurrency.useToDisplay(month)
  const envData = balances.useEnvData()?.[month]?.[id]

  return new Array(31).fill(null).map((_, i) => {
    return { day: i, date: null, balance: null }
  })

  // const leftover = envData.totalLeftover
  // const budgeted = envData.totalBudgeted
  // const activityTrend = envData.totalActivityTrend

  // const start = addFxAmount(leftover, budgeted)

  // let prevStart = start
  // const adjustedTrend = activityTrend.map(amount => {
  //   const next = addFxAmount(amount, prevStart)
  //   prevStart = next
  //   return next
  // })

  // const result: TTrendNode[] = [
  //   { day: 0, date: null, balance: toDisplay(start) },
  // ]

  // const currDate = toISODate(new Date())
  // adjustedTrend.forEach((amount, i) => {
  //   const day = i + 1
  //   const date = getDate(day)
  //   const balance = date === null || date > currDate ? null : toDisplay(amount)
  //   result.push({ day, date, balance })
  // })

  // return result

  function getDate(day: number) {
    const isoDate = (month + '-' + day.toString().padStart(2, '0')) as TISODate
    const isValid = new Date(isoDate).toString() !== 'Invalid Date'
    return isValid ? isoDate : null
  }
}

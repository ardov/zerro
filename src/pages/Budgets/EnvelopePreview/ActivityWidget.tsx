import React, { FC, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { Box, BoxProps, useTheme } from '@mui/material'
import { TFxAmount, TISOMonth } from '@shared/types'
import Rhythm from '@shared/ui/Rhythm'
import { DataLine } from '@components/DataLine'
import { formatDate } from '@shared/helpers/date'
import { convertFx } from '@shared/helpers/money'
import { useMonth } from '@shared/hooks/useMonth'

import { balances } from '@entities/envBalances'
import { TEnvelopeId } from '@entities/envelope'

type ActivityWidgetProps = BoxProps & { id: TEnvelopeId }

export const ActivityWidget: FC<ActivityWidgetProps> = ({
  id,
  ...boxProps
}) => {
  const [month, setMonth] = useMonth()
  const [highlighted, setHighlighted] = useState(month)
  const rates = balances.useRates()
  const envData = balances.useEnvData()
  const dates = balances.useMonthList()
  const { currency } = envData[month][id]
  const dateRange = getDateRange(dates, 12, month)

  const data = dateRange.map(month => {
    const envelope = envData[month][id]
    const toEnvelope = (a: TFxAmount) =>
      convertFx(a, currency, rates[month].rates)
    let activity = toEnvelope(envelope.totalActivity)
    let leftover = toEnvelope(envelope.totalLeftover)
    let budgeted = toEnvelope(envelope.totalBudgeted)
    let available = toEnvelope(envelope.totalAvailable)
    let startingAmount = leftover + budgeted
    if (activity > 0) {
      // Handle positive outcome. It's possible with income transfers
      activity = 0
      startingAmount = available
    }

    // Prevent chart going weird
    if (startingAmount < 0) startingAmount = 0

    return {
      date: month,
      activity: -activity,
      leftover,
      budgeted,
      available,
      startingAmount,
    }
  })

  const selectedData = data.find(node => node.date === highlighted)
  useEffect(() => {
    setHighlighted(month)
  }, [month])

  const theme = useTheme()
  const activityColor = theme.palette.info.main
  const budgetLineColor = theme.palette.background.default
  const startingAmountColor = theme.palette.primary.main

  const StartingAmountTooltip = (
    <Rhythm gap={0.5}>
      <DataLine
        name="Бюджет в этом месяце"
        amount={selectedData?.budgeted}
        currency={currency}
      />
      <DataLine
        name="Остаток с прошлого месяца"
        amount={selectedData?.leftover}
        currency={currency}
      />
    </Rhythm>
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
      <Rhythm gap={0.5} pt={2} px={2}>
        <DataLine
          name="Расход"
          color={activityColor}
          amount={selectedData?.activity}
          currency={currency}
        />
        <DataLine
          name={`Доступно на ${formatDate(highlighted, 'LLL')}`}
          color={startingAmountColor}
          colorOpacity={0.2}
          amount={selectedData?.startingAmount}
          currency={currency}
          tooltip={StartingAmountTooltip}
        />
      </Rhythm>

      <Box width="100%" height="160px">
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, left: 16, bottom: 0 }}
            barGap={0}
            onMouseMove={onMouseMove}
            onClick={onClick}
            onMouseLeave={() => setHighlighted(month)}
          >
            <Bar
              dataKey="startingAmount"
              fill={startingAmountColor}
              shape={
                // @ts-ignore
                <BudgetBar />
              }
            />
            <Bar
              dataKey="activity"
              fill={activityColor}
              shape={
                // @ts-ignore
                <ActivityBar current={highlighted} />
              }
            />
            <Bar
              dataKey="startingAmount"
              fill={budgetLineColor}
              shape={
                // @ts-ignore
                <BudgetLine />
              }
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={d => formatDate(d, 'LLL').slice(0, 3)}
              minTickGap={4}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

type BarProps = {
  fill?: string
  x: number
  y: number
  width: number
  height: number
}

const BudgetBar: FC<BarProps> = ({ fill, x, y, width, height }) => {
  if (height <= 0) return null
  return (
    <rect
      rx={4}
      ry={4}
      x={x}
      y={y}
      width={width * 3}
      height={height}
      fill={fill}
      fillOpacity="0.2"
    />
  )
}

type ActivityBarProps = BarProps & {
  date: number
  current: number
}

const ActivityBar: FC<ActivityBarProps> = props => {
  const { fill, x, y, width, height, date, current } = props

  return (
    <>
      {height > 0 && (
        <rect
          rx={4}
          ry={4}
          x={x - width}
          y={y}
          width={width * 3}
          height={height}
          fill={fill}
        />
      )}
      {date === current && (
        <circle
          cx={x - width + (width * 3) / 2}
          cy={y + height + 5}
          r="2"
          fill={fill}
        />
      )}
    </>
  )
}

type BudgetLineProps = BarProps & {
  activity: number
  startingAmount: number
}

const BudgetLine: FC<BudgetLineProps> = props => {
  const { fill, x, y, width, activity, startingAmount } = props
  if (startingAmount >= activity || !activity) return null
  return (
    <rect x={x - width * 2} y={y} width={width * 3} height={1} fill={fill} />
  )
}

function getDateRange(
  dates: TISOMonth[],
  range: number,
  targetMonth: TISOMonth
) {
  const idx = dates.findIndex(d => d === targetMonth)
  const arrayToTrim =
    idx === dates.length - 1 ? dates : dates.slice(0, dates.length - 1)
  if (idx === -1) return trimArray(arrayToTrim, range)
  return trimArray(arrayToTrim, range, idx)
}

/** Cuts out a range with target index in center */
function trimArray<T>(
  arr: Array<T> = [],
  range = 1,
  targetIdx?: number
): Array<T> {
  if (arr.length <= range) return arr
  if (targetIdx === undefined) return arr.slice(-range)

  let padLeft = Math.floor((range - 1) / 2)
  let padRight = range - 1 - padLeft
  let rangeStart = targetIdx - padLeft
  let rangeEnd = targetIdx + padRight

  if (rangeEnd >= arr.length) return arr.slice(-range)
  if (rangeStart <= 0) return arr.slice(0, range)
  return arr.slice(rangeStart, rangeEnd + 1)
}

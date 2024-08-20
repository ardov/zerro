import React, { FC, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { Stack, Box, BoxProps } from '@mui/material'
import ChooseButton from './ChooseButton'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '6-shared/ui/theme'
import { TFxAmount, TISOMonth } from '6-shared/types'
import { formatDate } from '6-shared/helpers/date'

import { balances, TEnvMetrics } from '5-entities/envBalances'
import { TEnvelopeId } from '5-entities/envelope'
import { fxRateModel } from '5-entities/currency/fxRate'
import { DataLine } from '3-widgets/DataLine'
import { useMonth } from '../MonthProvider'
import { getDateRange } from './shared'

type StatisticWidgetProps = BoxProps & { id: TEnvelopeId }

enum aggregateType {
  MovingAverage = 'movingAverage',
  MovingMedian = 'movingMedian'
}

enum aggregatePeriod {
  threeMonths = 'threeMonths',
  sixMonths = 'sixMonths',
  twelveMonths = 'twelveMonths'
}

enum statisticsValue {
  activity = 'activity',
  budgeted = 'budgeted'
}

let aggregatePeriods = [aggregatePeriod.threeMonths, aggregatePeriod.sixMonths, aggregatePeriod.twelveMonths]
let aggregateTypes = [aggregateType.MovingAverage, aggregateType.MovingMedian]
let statisticsValues = [statisticsValue.activity, statisticsValue.budgeted]

export const StatisticWidget: FC<StatisticWidgetProps> = ({
  id,
  ...boxProps
}) => {
  const { t } = useTranslation('budgets', { keyPrefix: 'statisticWidget' })
  const [month, setMonth] = useMonth()
  const [highlighted, setHighlighted] = useState(month)
  const [aggregatePeriod, setAggregatePeriod] = useState(aggregatePeriods[1])
  const [aggregateType, setAggregateType] = useState(aggregateTypes[0])
  const [statisticsValue, setStatisticsValues] = useState(statisticsValues[0])
  const convertFx = fxRateModel.useConverter()
  const envData = balances.useEnvData()
  const dates = balances.useMonthList()
  const { currency } = envData[month][id]
  const dateRange = getDateRange(dates, 24, month)

  useEffect(() => {
    setHighlighted(month)
  }, [month])

  const data = dateRange.map(m => {
    const dateR = getPreviousMonths(dates, chooseAggregatePeriod(aggregatePeriod), m)
    const activities: number[] = [];
    const budgeteds: number[] = [];
    for (const d of dateR) {
      const envelope = envData[d][id]
      const toEnvelope = (a: TFxAmount) => convertFx(a, currency, d)
      let activity = toEnvelope(envelope.totalActivity)
      let budgeted = toEnvelope(envelope.totalBudgeted)
      if (activity > 0) {
        activity = 0
      }
      activities.push(-activity)
      budgeteds.push(budgeted)
    }

    let activity = calculateValue(activities, aggregateType)
    let budgeted = calculateValue(budgeteds, aggregateType)

    return {
      date: m,
      activity: activity,
      budgeted,
    }
  })

  const selectedData = data.find(node => node.date === highlighted)

  const theme = useAppTheme()
  const positiveStatColor = theme.palette.info.main
  const negativeStatColor = theme.palette.error.main

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
      <Stack direction="row" spacing={0} pt={2} px={2}>
        <ChooseButton
          chosen={statisticsValue}
          elements={statisticsValues}
          onChoose={(val) => { setStatisticsValues(val) }}
          renderValue={(value) => t(value)}
        />
        <ChooseButton
          chosen={aggregateType}
          elements={aggregateTypes}
          onChoose={(val) => { setAggregateType(val) }}
          renderValue={(value) => t(value)}
        />
        <ChooseButton
          chosen={aggregatePeriod}
          elements={aggregatePeriods}
          onChoose={(val) => { setAggregatePeriod(val) }}
          renderValue={(value) => t(value)}
        />
      </Stack>
      <Stack spacing={0.5} pt={2} px={2}>
        <DataLine
          name={t(`${aggregateType}Full`)}
          color={positiveStatColor}
          amount={selectedData ? Number(selectedData[statisticsValue as keyof typeof selectedData]) : undefined}
          currency={currency}
        />
      </Stack>
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
              dataKey={statisticsValue}
              shape={
                // @ts-ignore
                <StatisticBar
                  current={highlighted}
                  positiveColor={positiveStatColor}
                  negativeColor={negativeStatColor}
                />
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
  positiveColor?: string
  negativeColor?: string
  x: number
  y: number
  width: number
  height: number
  date: TISOMonth
  current: TISOMonth
}

const StatisticBar: FC<BarProps> = props => {
  const { positiveColor, negativeColor, x, y, width, height, date, current } = props

  return (
    <>
      <rect
        rx={4}
        ry={4}
        x={x}
        y={height > 0 ? y : y + height}
        width={width}
        height={height > 0 ? height : -height}
        fill={height > 0 ? positiveColor : negativeColor}
      />
      {date === current && (
        <circle
          cx={x - width + (width * 3) / 2}
          cy={height > 0 ? y + height + 5 : y + height - 5}
          r="2"
          fill={height > 0 ? positiveColor : negativeColor}
        />
      )}
    </>
  )
}

function getPreviousMonths(
  dates: TISOMonth[],
  range: number,
  targetMonth: TISOMonth) {
  const idx = dates.findIndex(d => d === targetMonth)
  const startIndex = Math.max(0, idx - range + 1)
  return dates.slice(startIndex, idx + 1)
}

function getConvertedStatisticsValue(
  statValue: statisticsValue,
  currency: string,
  date: TISOMonth,
  envelope: TEnvMetrics) {
  const convertFx = fxRateModel.useConverter()
  if (statValue === statisticsValue.budgeted) {
    return convertFx(envelope.totalBudgeted, currency, date)
  }
  let activity = convertFx(envelope.totalActivity, currency, date)
  return activity > 0 ? 0 : -activity
}

function calculateValue(arr: number[], aggType: string): number {
  if (aggType === aggregateType.MovingMedian) {
    return median(arr)
  }
  return average(arr)
}

// Helper function to calculate the median of an array
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function average(arr: number[]): number {
  const sum = arr.reduce((acc, val) => acc + val, 0)
  return arr.length ? sum / arr.length : 0
}

function chooseAggregatePeriod(aggregatePeriodString: string) {
  switch (aggregatePeriodString) {
    case aggregatePeriod.threeMonths:
      return 3
    case aggregatePeriod.sixMonths:
      return 6
    case aggregatePeriod.twelveMonths:
      return 12
    default:
      return 6
  }
}

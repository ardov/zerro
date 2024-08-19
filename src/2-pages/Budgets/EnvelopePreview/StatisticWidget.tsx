import React, { FC, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { Stack, Box, BoxProps } from '@mui/material'
import ChooseButton from './ChooseButton'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '6-shared/ui/theme'
import { TFxAmount, TISOMonth } from '6-shared/types'
import { formatDate } from '6-shared/helpers/date'

import { balances } from '5-entities/envBalances'
import { TEnvelopeId } from '5-entities/envelope'
import { fxRateModel } from '5-entities/currency/fxRate'
import { DataLine } from '3-widgets/DataLine'
import { useMonth } from '../MonthProvider'

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

let aggregatePeriods = [aggregatePeriod.threeMonths, aggregatePeriod.sixMonths, aggregatePeriod.twelveMonths]
let aggregateTypes = [aggregateType.MovingAverage, aggregateType.MovingMedian]
let statisticsValues = ['activity', 'budgeted']

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
  useEffect(() => {
    setHighlighted(month)
  }, [month])

  const theme = useAppTheme()
  const activityColor = theme.palette.info.main

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
          onChoose={(val) => {setStatisticsValues(val)}}
          renderValue={(value) => t(value)}
        />
        <ChooseButton
          chosen={aggregateType}
          elements={aggregateTypes}
          onChoose={(val) => {setAggregateType(val)}}
          renderValue={(value) => t(value)}
        />
        <ChooseButton
          chosen={aggregatePeriod}
          elements={aggregatePeriods}
          onChoose={(val) => {setAggregatePeriod(val)}}
          renderValue={(value) => t(value)}
        />
      </Stack>
      <Stack spacing={0.5} pt={2} px={2}>
        <DataLine
          name={t(`${aggregateType}Full`)}
          color={activityColor}
          amount={selectedData ? Number(selectedData[statisticsValue as keyof typeof selectedData]) : undefined}
          currency={currency}
        />
      </Stack>
      <Box width="100%" height="160px">
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{top: 8, right: 16, left: 16, bottom: 0}}
            barGap={0}
            onMouseMove={onMouseMove}
            onClick={onClick}
            onMouseLeave={() => setHighlighted(month)}
          >
            <Bar
              dataKey={statisticsValue}
              fill={activityColor}
              shape={
                // @ts-ignore
                <ActivityBar current={highlighted}/>
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
  date: number
  current: number
}

const ActivityBar: FC<BarProps> = props => {
  const { fill, x, y, width, height, date, current } = props

  return (
    <>
      {height > 0 && (
        <rect
          rx={4}
          ry={4}
          x={x}
          y={y}
          width={width}
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

function getPreviousMonths(
  dates: TISOMonth[],
  range: number,
  targetMonth: TISOMonth) {
  const idx = dates.findIndex(d => d === targetMonth)
  const startIndex = Math.max(0, idx - range + 1);
  return dates.slice(startIndex, idx + 1);
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

function calculateValue(arr: number[], aggType: string):number {
  if (aggType === aggregateType.MovingMedian) {
    return median(arr)
  }
  return average(arr)
}

// Helper function to calculate the median of an array
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function average(arr: number[]): number {
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return arr.length ? sum / arr.length : 0;
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

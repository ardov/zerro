import React, { FC, useEffect, useState } from 'react'
import { useAppSelector } from 'models'
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { Box, BoxProps, useTheme } from '@mui/material'
import { formatDate } from 'shared/helpers/format'
import Rhythm from 'shared/ui/Rhythm'
import { getAmountsById } from 'pages/Budgets/selectors'
import { getMonthDates } from 'pages/Budgets/selectors'
import { useMonth } from 'pages/Budgets/pathHooks'
import { DataLine } from '../../../../shared/ui/DataLine'

type OutcomWidgetProps = BoxProps & {
  tagId: string
}

export const OutcomeWidget: FC<OutcomWidgetProps> = ({
  tagId,
  ...boxProps
}) => {
  const [month, setMonth] = useMonth()
  const [selected, setSelected] = useState(month)
  const allAmounts = useAppSelector(getAmountsById)
  const dates = useAppSelector(getMonthDates)
  const dateRange = getDateRange(dates, 12, month)

  const data = dateRange.map(date => {
    const tagData = allAmounts[date][tagId]
    let outcome = tagData.totalOutcome
    let leftover = tagData.totalLeftover
    let budgeted = tagData.totalBudgeted
    let available = tagData.totalAvailable
    let startingAmount = available + outcome
    if (outcome < 0) {
      // Handle positive outcome. It's possible with income transfers
      outcome = 0
      startingAmount = available
    }

    // Prevent chart going weird
    if (startingAmount < 0) startingAmount = 0

    return { date, outcome, leftover, budgeted, available, startingAmount }
  })

  const selectedData = data.find(node => node.date === selected)
  useEffect(() => {
    setSelected(month)
  }, [month])

  const theme = useTheme()
  const outcomeColor = theme.palette.info.main
  const budgetLineColor = theme.palette.background.default
  const startingAmountColor = theme.palette.primary.main

  const StartingAmountTooltip = (
    <Rhythm gap={0.5}>
      <DataLine name="Бюджет в этом месяце" amount={selectedData?.budgeted} />
      <DataLine
        name="Остаток с прошлого месяца"
        amount={selectedData?.leftover}
      />
    </Rhythm>
  )

  const onMouseMove = (e: any) => {
    if (e?.activeLabel && e.activeLabel !== selected) {
      setSelected(e.activeLabel)
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
          color={outcomeColor}
          amount={selectedData?.outcome}
        />
        <DataLine
          name={`Доступно на ${formatDate(selected, 'LLL')}`}
          color={startingAmountColor}
          colorOpacity={0.2}
          amount={selectedData?.startingAmount}
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
            onMouseLeave={() => setSelected(month)}
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
              dataKey="outcome"
              fill={outcomeColor}
              shape={
                // @ts-ignore
                <OutcomeBar current={selected} />
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

type OutcomeBarProps = BarProps & {
  date: number
  current: number
}

const OutcomeBar: FC<OutcomeBarProps> = props => {
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
  outcome: number
  startingAmount: number
}

const BudgetLine: FC<BudgetLineProps> = props => {
  const { fill, x, y, width, outcome, startingAmount } = props
  if (startingAmount >= outcome || !outcome) return null
  return (
    <rect x={x - width * 2} y={y} width={width * 3} height={1} fill={fill} />
  )
}

function getDateRange(dates: number[], range: number, targetMonth: number) {
  const idx = dates.findIndex(d => d === targetMonth)
  const arrayToTrim =
    idx === dates.length - 1 ? dates : dates.slice(0, dates.length - 1)
  if (idx === -1) return trimArray(arrayToTrim, range)
  return trimArray(arrayToTrim, range, idx)
}

/** Cuts out a range with target index in center */
function trimArray(arr: number[] = [], range = 1, targetIdx?: number) {
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

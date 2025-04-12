import React, { FC, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { Stack, Box, BoxProps } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '6-shared/ui/theme'
import { TFxAmount, TISOMonth } from '6-shared/types'
import { formatDate } from '6-shared/helpers/date'

import { balances } from '5-entities/envBalances'
import { TEnvelopeId } from '5-entities/envelope'
import { fxRateModel } from '5-entities/currency/fxRate'
import { DataLine } from '3-widgets/DataLine'
import { useMonth } from '../MonthProvider'
import { getDateRange } from './shared'

type ActivityWidgetProps = BoxProps & { id: TEnvelopeId }

export const ActivityWidget: FC<ActivityWidgetProps> = props => {
  const { id, ...boxProps } = props
  const { t } = useTranslation('budgets')
  const [month, setMonth] = useMonth()
  const [highlighted, setHighlighted] = useState(month)
  const convertFx = fxRateModel.useConverter()
  const envData = balances.useEnvData()
  const dates = balances.useMonthList()
  const { currency } = envData[month][id]
  const dateRange = getDateRange(dates, 12, month)

  const data = dateRange.map(month => {
    const envelope = envData[month][id]
    const toEnvelope = (a: TFxAmount) => convertFx(a, currency, month)
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

  const theme = useAppTheme()
  const activityColor = theme.palette.info.main
  const budgetLineColor = theme.palette.background.default
  const startingAmountColor = theme.palette.primary.main

  return (
    <Box
      {...boxProps}
      sx={[
        {
          borderRadius: 1,
          bgcolor: 'background.default',
        },
        ...(Array.isArray(boxProps.sx) ? boxProps.sx : [boxProps.sx]),
      ]}
    >
      <Stack spacing={0.5} sx={{ pt: 2, px: 2 }}>
        <DataLine
          name={t('outcome', { ns: 'common' })}
          color={activityColor}
          amount={selectedData?.activity}
          currency={currency}
        />
        <DataLine
          name={`${t('availableFor')} ${formatDate(highlighted, 'LLL')}`}
          color={startingAmountColor}
          colorOpacity={0.2}
          amount={selectedData?.startingAmount}
          currency={currency}
          tooltip={
            <Stack spacing={0.5}>
              <DataLine
                name={t('budgetedThisMonth')}
                amount={selectedData?.budgeted}
                currency={currency}
              />
              <DataLine
                name={t('leftoverFromLastMonth')}
                amount={selectedData?.leftover}
                currency={currency}
              />
            </Stack>
          }
        />
      </Stack>
      <Box sx={{ width: '100%', height: '160px' }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, left: 16, bottom: 0 }}
            barGap={0}
            onClick={e => {
              if (!e.activeLabel || e.activeLabel === month) return
              setMonth(e.activeLabel as TISOMonth)
            }}
            onMouseMove={e => {
              if (!e.activeLabel || e.activeLabel === highlighted) return
              setHighlighted(e.activeLabel as TISOMonth)
            }}
            onMouseLeave={() => setHighlighted(month)}
          >
            <Bar
              dataKey="startingAmount"
              fill={startingAmountColor}
              // @ts-ignore
              shape={<BudgetBar />}
            />
            <Bar
              dataKey="activity"
              fill={activityColor}
              // @ts-ignore
              shape={<ActivityBar current={highlighted} />}
            />
            <Bar
              dataKey="startingAmount"
              fill={budgetLineColor}
              // @ts-ignore
              shape={<BudgetLine />}
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

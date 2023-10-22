import React, { FC } from 'react'
import { Area, ComposedChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { Stack, Box, BoxProps } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { formatDate, getMonthLength, toISODate } from '6-shared/helpers/date'
import { useAppTheme } from '6-shared/ui/theme'
import { prevMonth, toISOMonth } from '6-shared/helpers/date'
import { TFxAmount, TISODate, TISOMonth } from '6-shared/types'
import { addFxAmount, round } from '6-shared/helpers/money'

import { balances } from '5-entities/envBalances'
import { TEnvelopeId } from '5-entities/envelope'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { DataLine } from '3-widgets/DataLine'

import { useMonth } from '../MonthProvider'

type BurndownWidgetProps = BoxProps & { id: TEnvelopeId }

export const BurndownWidget: FC<BurndownWidgetProps> = ({
  id,
  ...boxProps
}) => {
  const { t } = useTranslation('budgets')
  const [month] = useMonth()
  const envData = balances.useEnvData()
  const { currency } = envData[month][id]

  return (
    <Box borderRadius={1} bgcolor="background.default" {...boxProps}>
      <Stack spacing={0.5} pt={2} px={2}>
        <DataLine
          name={`${t('balanceFor')} ${formatDate(month, 'LLL')}`}
          // color={activityColor}
          // amount={selectedData?.activity}
          // amount={0}
          currency={currency}
          tooltip={t('balanceChartTooltip')}
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
  const monthLength = getMonthLength(month)
  const trend = currTrend.map((node, i) => {
    const prev = prevTrend[i] || {}
    const burndown = round(startValue - (startValue / monthLength) * i)
    return {
      ...node,
      prevDate: prev.date || null,
      prevBalance: prev.balance || null,
      burndown: burndown < 0 ? null : burndown,
    }
  })
  trend.splice(monthLength, trend.length - monthLength)
  return trend
}

type TTrendNode = {
  day: number
  date: TISODate | null
  balance: number | null
}

function useDataTrend(month: TISOMonth, id: TEnvelopeId): TTrendNode[] {
  const toDisplay = displayCurrency.useToDisplay(month)
  const envData = balances.useEnvData()?.[month]?.[id]
  const activityTrend = useActivityTrend(month, id)

  const startBalance = addFxAmount(
    envData?.totalLeftover || {},
    envData?.totalBudgeted || {}
  )

  const startNode = {
    day: 0,
    date: getDate(month, 1),
    balance: startBalance,
  }

  let prevBalance = startNode.balance
  const eodBalances = activityTrend.map((activity, i) => {
    const day = i + 1
    const node = {
      day,
      date: getDate(month, day),
      balance: addFxAmount(prevBalance, activity),
    }
    prevBalance = node.balance
    return node
  })

  const array = [startNode, ...eodBalances]

  const currentISODate = toISODate(new Date())
  return array.map(node => {
    // Balance for future dates is null
    const isInFuture = !node.date || node.date > currentISODate
    const balance = isInFuture ? null : toDisplay(node.balance)
    return { ...node, balance }
  })
}

/**
 * Returns an array of 31 nodes, each representing a day of the month.
 * @param month
 * @param id
 * @returns
 */
function useActivityTrend(month: TISOMonth, id: TEnvelopeId): TFxAmount[] {
  const activity = balances.useActivity()?.[month]?.envActivity?.byEnv
  const envData = balances.useEnvData()?.[month]?.[id]

  let trend = new Array(31).fill({})
  if (!envData) return trend

  const activityTrends = [
    activity?.[id]?.trend,
    ...envData.children.map(id => activity?.[id]?.trend),
  ].filter(Boolean)

  return trend.map((_, i) => {
    const dailyActivity = activityTrends.map(trend => trend[i] || {})
    if (dailyActivity.length) return addFxAmount(...dailyActivity)
    return {}
  })
}

function getDate(month: TISOMonth, day: number) {
  const isoDate = (month + '-' + day.toString().padStart(2, '0')) as TISODate
  const isValid = new Date(isoDate).toString() !== 'Invalid Date'
  return isValid ? isoDate : null
}

import React, { FC, useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts'
import {
  Stack,
  Box,
  BoxProps,
  Typography,
  ButtonBase,
  ButtonBaseProps,
  SxProps,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '6-shared/ui/theme'
import { TFxCode, TISOMonth } from '6-shared/types'
import { formatDate, toISOMonth } from '6-shared/helpers/date'
import { getAverage } from '6-shared/helpers/money/currencyHelpers'

import { balances } from '5-entities/envBalances'
import { envelopeModel, TEnvelopeId } from '5-entities/envelope'
import { fxRateModel } from '5-entities/currency/fxRate'
import { DataLine } from '3-widgets/DataLine'
import { useMonth } from '../MonthProvider'
import { trimMonths } from './shared'

type StatisticWidgetProps = BoxProps & { id: TEnvelopeId }

const WINDOW = 12 // Number of months to show in the chart

enum statisticsValue {
  avgBudgeted = 'avgBudgeted',
  avgExpenses = 'avgExpenses',
}
const nextMetric = (current: statisticsValue): statisticsValue => {
  const list = [statisticsValue.avgBudgeted, statisticsValue.avgExpenses]
  const idx = list.indexOf(current)
  return list[(idx + 1) % list.length]
}

enum aggregatePeriod {
  months3 = 'months3',
  months6 = 'months6',
  months12 = 'months12',
}
const nextPeriod = (current: aggregatePeriod): aggregatePeriod => {
  const list = [
    aggregatePeriod.months3,
    aggregatePeriod.months6,
    aggregatePeriod.months12,
  ]
  const idx = list.indexOf(current)
  return list[(idx + 1) % list.length]
}
const getPeriodLength = (period: aggregatePeriod): number => {
  switch (period) {
    case aggregatePeriod.months3:
      return 3
    case aggregatePeriod.months6:
      return 6
    case aggregatePeriod.months12:
      return 12
  }
}

/** Calculate average budgeted and expenses for the given envelope */
function useAggregatedStats(
  id: TEnvelopeId,
  currency: TFxCode,
  aggregationPeriod: number
) {
  const dates = balances.useMonthList()
  const envData = balances.useEnvData()
  const convertFx = fxRateModel.useConverter()
  const result = dates.map((month, idx) => {
    const aggregatedMonths = dates.slice(
      Math.max(0, idx - aggregationPeriod + 1), // start index
      idx + 1 // end index
    )
    const avgBudgeted = getAverage(
      aggregatedMonths.map(date =>
        convertFx(envData[date][id].totalBudgeted, currency, date)
      )
    )
    const currentMonth = toISOMonth(new Date())
    let avgExpenses = 0
    // Do not calculate expenses for future months
    if (month <= currentMonth) {
      const avgActivity = getAverage(
        aggregatedMonths.map(date =>
          convertFx(envData[date][id].totalActivity, currency, date)
        )
      )
      // Negative activity is expenses
      if (avgActivity < 0) avgExpenses = -avgActivity
    }
    return { month, avgBudgeted, avgExpenses }
  })
  return result
}

export const StatisticWidget: FC<StatisticWidgetProps> = ({
  id,
  ...boxProps
}) => {
  const { t } = useTranslation('budgets', { keyPrefix: 'statisticWidget' })
  const [month, setMonth] = useMonth()
  const theme = useAppTheme()
  const positiveColor = theme.palette.info.main
  const negativeColor = theme.palette.error.main

  const [metric, setMetric] = useState<statisticsValue>(
    statisticsValue.avgExpenses
  )
  const switchMetric = () => setMetric(nextMetric)
  const [period, setPeriod] = useState<aggregatePeriod>(aggregatePeriod.months6)
  const switchPeriod = () => setPeriod(nextPeriod)

  const currency = envelopeModel.useEnvelopes()[id].currency

  const aggregatedData = useAggregatedStats(
    id,
    currency,
    getPeriodLength(period)
  )
  const chartData = aggregatedData.map(node => {
    const value = node[metric]
    const fill = value >= 0 ? positiveColor : negativeColor
    return { month: node.month, value, fill }
  })
  const currentDataIdx = chartData.findIndex(node => node.month === month)
  const trimmedData = trimMonths(chartData, WINDOW, currentDataIdx)

  const [selectedMonth, setSelectedMonth] = useState(month)
  const selectedData = trimmedData.find(node => node.month === selectedMonth)

  useEffect(() => {
    setSelectedMonth(month)
  }, [month])

  return (
    <Box borderRadius={1} bgcolor="background.default" {...boxProps}>
      <Box px={2} pt={2}>
        <Typography variant="body1" color="text.primary">
          <span>{t('average')} </span>
          <InlineButton onClick={switchMetric}>{t(metric)}</InlineButton>
          <span> {t('over')} </span>
          <InlineButton onClick={switchPeriod}>{t(period)}</InlineButton>
        </Typography>
      </Box>

      {selectedData && (
        <Stack spacing={0.5} pt={2} px={2}>
          <DataLine
            name={t('avgForDate', {
              date: formatDate(selectedData.month, 'LLL'),
            })}
            color={selectedData.fill}
            amount={selectedData.value}
            currency={currency}
          />
        </Stack>
      )}
      <Box width="100%" height="160px">
        <ResponsiveContainer>
          <BarChart
            data={trimmedData}
            margin={{ top: 8, right: 16, left: 16, bottom: 0 }}
            barGap={0}
            onMouseMove={e => {
              const activeMonth = (e?.activeLabel || selectedMonth) as TISOMonth
              setSelectedMonth(activeMonth)
            }}
            onClick={e => {
              const activeMonth = (e?.activeLabel || month) as TISOMonth
              setMonth(activeMonth)
            }}
            onMouseLeave={() => setSelectedMonth(month)}
          >
            <Bar dataKey="value" radius={4} />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tickFormatter={d => formatDate(d, 'LLL').slice(0, 3)}
              minTickGap={8}
            />

            {/* Selected month indicator */}
            {selectedData && (
              <ReferenceDot
                x={selectedData.month}
                y={0}
                r={2}
                isFront
                shape={({ cx, cy }) => {
                  const offset = selectedData.value >= 0 ? 5 : -5
                  const fill = selectedData.fill
                  return <circle cx={cx} cy={cy + offset} r={2} fill={fill} />
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

const inlineButtonSx: SxProps = {
  cursor: 'pointer',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  display: 'inline',
  px: 1,
  mx: -1,
  borderRadius: 1,
  verticalAlign: 'baseline',
  color: 'info.main',
}

const InlineButton: FC<ButtonBaseProps> = props => {
  const { sx, ...delegated } = props
  const buttonSx = sx ? { ...inlineButtonSx, ...sx } : inlineButtonSx
  return <ButtonBase sx={buttonSx} {...delegated} />
}

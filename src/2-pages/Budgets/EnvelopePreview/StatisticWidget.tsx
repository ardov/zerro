import { cn } from '@/6-shared/ui/shadcn/utils'
import type { ButtonBaseProps } from '@/6-shared/ui/Button'
import { ButtonBase } from '@/6-shared/ui/Button'
import type { FC } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import type { TFxCode, TISOMonth } from '@/6-shared/types'
import { formatDate, toISOMonth } from '@/6-shared/helpers/date'
import { getAverage } from '@/6-shared/helpers/money/currencyHelpers'

import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

import { DataLine } from '@/3-widgets/DataLine'
import { useMonth } from '../MonthProvider'
import { trimMonths } from './shared'

type StatisticWidgetProps = Omit<ComponentPropsWithoutRef<'div'>, 'id'> & {
  id: core.envelopes.TEnvelopeId
}

const WINDOW = 12 // Number of months to show in the chart

enum statisticsValue {
  avgAssigned = 'avgAssigned',
  avgExpenses = 'avgExpenses',
}
const nextMetric = (current: statisticsValue): statisticsValue => {
  const list = [statisticsValue.avgAssigned, statisticsValue.avgExpenses]
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

/** Calculate average assigned and expenses for the given envelope */
function useAggregatedStats(
  id: core.envelopes.TEnvelopeId,
  currency: TFxCode,
  aggregationPeriod: number
) {
  const dates = useAppSelector(core.months.selectList)
  const envData = useAppSelector(core.activity.selectEnvelopeMetrics)
  const convertFx = useAppSelector(core.currency.selectConvertFx)
  const result = dates.map((month, idx) => {
    const aggregatedMonths = dates.slice(
      Math.max(0, idx - aggregationPeriod + 1), // start index
      idx + 1 // end index
    )
    const avgAssigned = getAverage(
      aggregatedMonths.map(date =>
        convertFx(envData[date][id].totalAssigned, currency, date)
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
    return { month, avgAssigned, avgExpenses }
  })
  return result
}

export const StatisticWidget: FC<StatisticWidgetProps> = ({
  id,
  className,
  style,
  ...rest
}) => {
  const { t } = useTranslation('budgets', { keyPrefix: 'statisticWidget' })
  const [month, setMonth] = useMonth()
  const positiveColor = 'var(--info)'
  const negativeColor = 'var(--error)'

  const [metric, setMetric] = useState<statisticsValue>(
    statisticsValue.avgExpenses
  )
  const switchMetric = () => setMetric(nextMetric)
  const [period, setPeriod] = useState<aggregatePeriod>(aggregatePeriod.months6)
  const switchPeriod = () => setPeriod(nextPeriod)

  const currency = useAppSelector(core.envelopes.selectAll)[id].currency

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

  const [prevMonth, setPrevMonth] = useState(month)
  if (prevMonth !== month) {
    setPrevMonth(month)
    setSelectedMonth(month)
  }

  return (
    <div
      {...rest}
      className={cn('rounded-lg bg-background', className)}
      style={style}
    >
      <div className="px-4 pt-4">
        <p className="m-0 text-body text-foreground">
          <span>{t('average')} </span>
          <InlineButton onClick={switchMetric}>{t(metric)}</InlineButton>
          <span> {t('over')} </span>
          <InlineButton onClick={switchPeriod}>{t(period)}</InlineButton>
        </p>
      </div>
      {selectedData && (
        <div className="flex flex-col gap-1 px-4 pt-4">
          <DataLine
            name={t('avgForDate', {
              date: formatDate(selectedData.month, 'LLL'),
            })}
            color={selectedData.fill}
            amount={selectedData.value}
            currency={currency}
          />
        </div>
      )}
      <div className="h-40 w-full">
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
                shape={({ cx, cy }) => {
                  const offset = selectedData.value >= 0 ? 5 : -5
                  const fill = selectedData.fill
                  return (
                    <circle cx={cx} cy={(cy ?? 0) + offset} r={2} fill={fill} />
                  )
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const inlineButtonClass =
  '-mx-2 inline cursor-pointer rounded-lg px-2 align-baseline text-[length:inherit] leading-[inherit] text-info'

const InlineButton: FC<ButtonBaseProps> = ({ className, ...delegated }) => (
  <ButtonBase className={cn(inlineButtonClass, className)} {...delegated} />
)

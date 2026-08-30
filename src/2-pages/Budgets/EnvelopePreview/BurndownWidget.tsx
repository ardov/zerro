import type { FC } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '6-shared/ui/shadcn/utils'
import { core } from 'zerro-core/redux'

import { useAppSelector } from 'store'

import { Area, ComposedChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { formatDate, getMonthLength, toISODate } from '6-shared/helpers/date'
import { prevMonth, toISOMonth } from '6-shared/helpers/date'
import type { TFxAmount, TISODate, TISOMonth } from '6-shared/types'
import { addFxAmount, round } from '6-shared/helpers/money'

import { DataLine } from '3-widgets/DataLine'

import { useMonth } from '../MonthProvider'

type BurndownWidgetProps = Omit<ComponentPropsWithoutRef<'div'>, 'id'> & {
  id: core.envelopes.TEnvelopeId
}

export const BurndownWidget: FC<BurndownWidgetProps> = ({
  id,
  className,
  style,
  ...rest
}) => {
  const { t } = useTranslation('budgets')
  const [month] = useMonth()
  const envData = useAppSelector(core.activity.selectEnvelopeMetrics)
  const { currency } = envData[month][id]

  return (
    <div
      {...rest}
      className={cn('rounded-lg bg-background', className)}
      style={style}
    >
      <div className="flex flex-col gap-1 px-4 pt-4">
        <DataLine
          name={`${t('balanceFor')} ${formatDate(month, 'LLL')}`}
          // color={activityColor}
          // amount={selectedData?.activity}
          // amount={0}
          currency={currency}
          tooltip={t('balanceChartTooltip')}
        />
      </div>
      <div className="h-40 w-full">
        <ChangesChart month={month} id={id} />
      </div>
    </div>
  )
}

type ChartProps = {
  month: TISOMonth
  id: core.envelopes.TEnvelopeId
}

export function ChangesChart(props: ChartProps) {
  const { id, month } = props
  const trend = useDoubleTrend(month, id)

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
          stroke="var(--primary)"
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="prevBalance"
          dot={false}
          stroke="var(--primary)"
          strokeWidth={0.5}
          strokeDasharray="2 3"
          isAnimationActive={false}
        />

        <Area
          type="monotone"
          dataKey="burndown"
          dot={false}
          fill="var(--primary)"
          fillOpacity={0.1}
          strokeWidth={0}
          isAnimationActive={false}
        />
        <YAxis domain={['dataMin', 'dataMax']} hide />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function useDoubleTrend(month: TISOMonth, id: core.envelopes.TEnvelopeId) {
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

function useDataTrend(
  month: TISOMonth,
  id: core.envelopes.TEnvelopeId
): TTrendNode[] {
  const toDisplay = core.currency.useToDisplay(month)
  const envData = useAppSelector(core.activity.selectEnvelopeMetrics)?.[
    month
  ]?.[id]
  const activityTrend = useActivityTrend(month, id)

  const startBalance = addFxAmount(
    envData?.totalLeftover || {},
    envData?.totalAssigned || {}
  )

  const startNode = {
    day: 0,
    date: getDate(month, 1),
    balance: startBalance,
  }

  const eodBalances: (typeof startNode)[] = []
  for (let i = 0; i < activityTrend.length; i++) {
    const day = i + 1
    const prevBalance = eodBalances[i - 1]?.balance ?? startNode.balance
    eodBalances.push({
      day,
      date: getDate(month, day),
      balance: addFxAmount(prevBalance, activityTrend[i]),
    })
  }

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
function useActivityTrend(
  month: TISOMonth,
  id: core.envelopes.TEnvelopeId
): TFxAmount[] {
  const activity = useAppSelector(core.activity.selectAll)?.[month]?.envActivity
    ?.byEnv
  const envData = useAppSelector(core.activity.selectEnvelopeMetrics)?.[
    month
  ]?.[id]

  const trend = new Array(31).fill({})
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

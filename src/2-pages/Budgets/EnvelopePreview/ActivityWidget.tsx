import type { FC } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { useState } from 'react'
import { cn } from '6-shared/ui/shadcn/utils'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import type { TFxAmount, TISOMonth } from '6-shared/types'
import { formatDate } from '6-shared/helpers/date'

import { DataLine } from '3-widgets/DataLine'
import { useMonth } from '../MonthProvider'
import { getDateRange } from './shared'

type ActivityWidgetProps = Omit<ComponentPropsWithoutRef<'div'>, 'id'> & {
  id: core.envelopes.TEnvelopeId
}

export const ActivityWidget: FC<ActivityWidgetProps> = props => {
  const { id, className, style, ...rest } = props
  const { t } = useTranslation('budgets')
  const [month, setMonth] = useMonth()
  const [highlighted, setHighlighted] = useState(month)
  const convertFx = useAppSelector(core.currency.selectConvertFx)
  const envData = useAppSelector(core.activity.selectEnvelopeMetrics)
  const dates = useAppSelector(core.months.selectList)
  const { currency } = envData[month][id]
  const dateRange = getDateRange(dates, 12, month)

  const data = dateRange.map(month => {
    const envelope = envData[month][id]
    const toEnvelope = (a: TFxAmount) => convertFx(a, currency, month)
    let activity = toEnvelope(envelope.totalActivity)
    const leftover = toEnvelope(envelope.totalLeftover)
    const assigned = toEnvelope(envelope.totalAssigned)
    const available = toEnvelope(envelope.totalAvailable)
    let startingAmount = leftover + assigned
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
      assigned,
      available,
      startingAmount,
    }
  })

  const selectedData = data.find(node => node.date === highlighted)
  const [prevMonth, setPrevMonth] = useState(month)
  if (prevMonth !== month) {
    setPrevMonth(month)
    setHighlighted(month)
  }

  const activityColor = 'var(--info)'
  const budgetLineColor = 'var(--background)'
  const startingAmountColor = 'var(--primary)'

  return (
    <div
      {...rest}
      className={cn('rounded-lg bg-background', className)}
      style={style}
    >
      <div className="flex flex-col gap-1 px-4 pt-4">
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
            <div className="flex flex-col gap-1">
              <DataLine
                name={t('assignedThisMonth')}
                amount={selectedData?.assigned}
                currency={currency}
              />
              <DataLine
                name={t('leftoverFromLastMonth')}
                amount={selectedData?.leftover}
                currency={currency}
              />
            </div>
          }
        />
      </div>
      <div className="h-40 w-full">
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
              // @ts-expect-error recharts shape prop typing
              shape={<BudgetBar />}
            />
            <Bar
              dataKey="activity"
              fill={activityColor}
              // @ts-expect-error recharts shape prop typing
              shape={<ActivityBar current={highlighted} />}
            />
            <Bar
              dataKey="startingAmount"
              fill={budgetLineColor}
              // @ts-expect-error recharts shape prop typing
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
      </div>
    </div>
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

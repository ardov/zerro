import { useState } from 'react'
import { core } from '@/zerro-core/redux'

import { useTranslation } from 'react-i18next'
import { CheckboxField } from '@/6-shared/ui/Checkbox'
import {
  ResponsiveContainer,
  ComposedChart,
  YAxis,
  Tooltip as RechartsTooltip,
  Bar,
  Line,
  ReferenceLine,
} from 'recharts'
import { Tooltip } from '@/6-shared/ui/Tooltip'
import { round } from '@/6-shared/helpers/money'
import { formatDate, GroupBy } from '@/6-shared/helpers/date'

import { DisplayAmount } from '@/3-widgets/DisplayAmount'
import { DataLine } from '@/3-widgets/DataLine'
import { Period, PeriodTitle } from '../shared/period'
import type { TNetWorthPoint } from './useNetWorth'
import { useNetWorth } from './useNetWorth'
import { useAverageExpenses } from './useAverageExpenses'

type Point = TNetWorthPoint & { total: number }
type TDataKey = keyof Omit<Point, 'date'>

/** The series colours, as tokens rather than palette values: a chart repaints
 * with the colour scheme through the cascade, without re-rendering. The paired
 * shades are what separates two series that share a meaning. */
const colors: Record<TDataKey, string> = {
  lented: 'var(--data-success)',
  debts: 'var(--data-error)',
  accountDebts: 'var(--data-error-alt)',
  fundsInBudget: 'var(--data-primary)',
  fundsSaving: 'var(--data-primary-alt)',
  total: 'var(--info)',
}

type WidgetNetWorthProps = {
  period: Period
  onTogglePeriod: () => void
}

export function WidgetNetWorth(props: WidgetNetWorthProps) {
  const { period, onTogglePeriod } = props
  const { t } = useTranslation('analytics')
  const balances = useNetWorth(period, GroupBy.Month)

  const [visibleParts, setVisibleParts] = useState<Array<TDataKey>>([
    'debts',
    'accountDebts',
    'fundsInBudget',
    'fundsSaving',
    'total',
  ])
  const isVisible = (key: TDataKey) => visibleParts.includes(key)
  const toggle = (key: TDataKey) =>
    setVisibleParts(arr =>
      arr.includes(key) ? visibleParts.filter(k => k !== key) : [...arr, key]
    )

  const points: Point[] = balances.map(b => {
    const total = round(
      (isVisible('lented') ? b.lented : 0) +
        (isVisible('debts') ? b.debts : 0) +
        (isVisible('accountDebts') ? b.accountDebts : 0) +
        (isVisible('fundsInBudget') ? b.fundsInBudget : 0) +
        (isVisible('fundsSaving') ? b.fundsSaving : 0)
    )
    return { ...b, total }
  })

  const names = {
    lented: t('netWorth.lented'),
    debts: t('netWorth.debts'),
    accountDebts: t('netWorth.accountDebts'),
    fundsInBudget: t('netWorth.fundsInBudget'),
    fundsSaving: t('netWorth.fundsSaving'),
    total: t('netWorth.total'),
  }

  const makeBar = (key: TDataKey) => {
    if (!isVisible(key)) return null
    return (
      <Bar
        dataKey={key}
        name={names[key]}
        stackId="a"
        fill={colors[key]}
        isAnimationActive={false}
      />
    )
  }

  const makeCheck = (key: TDataKey) => (
    <CheckboxField
      label={names[key]}
      // The series' own colour, checked or not, which is what tells the two
      // lines apart in the chart above.
      style={{ color: colors[key] }}
      className="[&_[data-slot=checkbox]]:text-current [&_[data-slot=checkbox]]:data-checked:text-current"
      checked={isVisible(key)}
      onCheckedChange={() => toggle(key)}
    />
  )

  return (
    <div className="surface-card shadow-elevation-1">
      <div className="min-w-full p-4">
        {/* Header */}
        <h2 className="m-0 type-title-lg">
          {t('netWorth.title')}{' '}
          <span
            style={{ color: 'var(--interactive)', cursor: 'pointer' }}
            onClick={onTogglePeriod}
          >
            <PeriodTitle period={period} />
          </span>
        </h2>

        <p className="mt-2 mb-0 type-body text-muted-foreground">
          <SurviveFact />
        </p>
      </div>
      {/* Chart */}
      <div className="h-[300px] min-w-full p-4">
        <ResponsiveContainer>
          <ComposedChart
            data={points}
            stackOffset="sign"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <YAxis type="number" domain={['dataMin', 'dataMax']} hide />
            <RechartsTooltip content={<CustomTooltip />} />
            {visibleParts.length > 0 && (
              <ReferenceLine y={0} stroke="var(--border)" />
            )}

            {makeBar('debts')}
            {makeBar('accountDebts')}
            {makeBar('fundsInBudget')}
            {makeBar('fundsSaving')}
            {makeBar('lented')}

            {isVisible('total') && (
              <Line
                type="monotone"
                dataKey="total"
                name={names.total}
                stroke={colors.total}
                isAnimationActive={false}
                dot={false}
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="p-4">
        {makeCheck('fundsInBudget')}
        {makeCheck('fundsSaving')}
        {makeCheck('accountDebts')}
        {makeCheck('debts')}
        {makeCheck('lented')}
        {makeCheck('total')}
      </div>
    </div>
  )
}

type TPayload = {
  // chartType: undefined
  color: string
  dataKey: string
  fill: string
  // formatter: undefined
  name: string
  payload: Point
  // type: undefined
  // unit: undefined
  value: number
}

const CustomTooltip = (props: any) => {
  const [currency] = core.currency.useDisplayCurrency()
  const payload = props.payload as TPayload[]
  const active = props.active as boolean
  if (!active || !payload?.length) return null
  const date = payload[0]?.payload?.date
  const values = payload.filter(v => v.value)
  return (
    <div className="surface-card shadow-elevation-10 p-4">
      <p className="m-0 type-title">
        {capitalize(formatDate(date, 'LLLL yyyy'))}
      </p>
      {values.map(v => (
        <DataLine
          color={v.color}
          key={v.dataKey}
          name={v.name}
          amount={v.value}
          currency={currency}
        />
      ))}
    </div>
  )
}

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function SurviveFact() {
  const { t } = useTranslation('analytics')
  const balances = useNetWorth(Period.LastYear, GroupBy.Month)
  const lastMonth = balances[balances.length - 1]
  const currentBalance = lastMonth.fundsInBudget + lastMonth.fundsSaving

  const averageExpenses = useAverageExpenses()
  if (averageExpenses === 0) return null
  const fundedMonths = Math.floor(currentBalance / averageExpenses)
  if (fundedMonths <= 0) return null

  const tooltipContent = (
    <div className="p-2">
      <p className="mt-0 mb-[0.35em] type-body-sm">
        {t('netWorth.tooltipCurrentBalance')}:{' '}
        <DisplayAmount value={currentBalance} />
      </p>
      <p className="m-0 type-body-sm">
        {t('netWorth.tooltipAvgExpenses')}:{' '}
        <DisplayAmount value={averageExpenses} />
      </p>
    </div>
  )

  return (
    <span>
      <Tooltip title={tooltipContent}>
        <span
          style={{
            borderBottom: '1px dashed rgb(from currentColor r g b / .5)',
          }}
        >
          {t('netWorth.surviveMonths', { count: fundedMonths })}
        </span>
      </Tooltip>{' '}
      {t('netWorth.surviveTagline')}
    </span>
  )
}

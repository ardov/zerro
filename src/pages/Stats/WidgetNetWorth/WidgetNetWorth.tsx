import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Card,
} from '@mui/material'
import {
  ResponsiveContainer,
  ComposedChart,
  YAxis,
  Tooltip,
  Bar,
  Line,
  ReferenceLine,
} from 'recharts'
import { useAppTheme } from '@shared/ui/theme'
import { round } from '@shared/helpers/money'
import { formatDate, GroupBy } from '@shared/helpers/date'

import { displayCurrency } from '@entities/currency/displayCurrency'
import { DataLine } from 'widgets/DataLine'
import { Period, periodTitles } from '../shared/period'
import { TPoint, useNetWorth } from './model'

type Point = TPoint & { total: number }
type TDataKey = keyof Omit<Point, 'date'>

type WidgetNetWorthProps = {
  period: Period
  onTogglePeriod: () => void
}

export function WidgetNetWorth(props: WidgetNetWorthProps) {
  const { period, onTogglePeriod } = props
  const theme = useAppTheme()

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
    let total = round(
      (isVisible('lented') ? b.lented : 0) +
        (isVisible('debts') ? b.debts : 0) +
        (isVisible('accountDebts') ? b.accountDebts : 0) +
        (isVisible('fundsInBudget') ? b.fundsInBudget : 0) +
        (isVisible('fundsSaving') ? b.fundsSaving : 0)
    )
    return { ...b, total }
  })

  const colors = {
    lented: theme.palette.success.light,
    debts: theme.palette.error.light,
    accountDebts: theme.palette.error.dark,
    fundsInBudget: theme.palette.primary.dark,
    fundsSaving: theme.palette.primary.light,
    total: theme.palette.info.main,
  }
  const names = {
    lented: 'Мне должны',
    debts: 'Долги',
    accountDebts: 'Кредиты',
    fundsInBudget: 'Деньги в балансе',
    fundsSaving: 'Деньги за балансом',
    total: 'Всего',
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

  const makeCheck = (key: TDataKey) => {
    return (
      <FormControlLabel
        label={names[key]}
        control={
          <Checkbox
            sx={{
              color: colors[key],
              '&.Mui-checked': {
                color: colors[key],
              },
            }}
            checked={isVisible(key)}
            onChange={() => toggle(key)}
          />
        }
      />
    )
  }

  return (
    <Paper>
      <Box p={2} minWidth="100%">
        <Typography variant="h5">
          Рост капитала{' '}
          <span
            style={{ color: theme.palette.secondary.main, cursor: 'pointer' }}
            onClick={onTogglePeriod}
          >
            {periodTitles[period]}
          </span>
        </Typography>
      </Box>

      <Box p={2} minWidth="100%" height={300}>
        <ResponsiveContainer>
          <ComposedChart
            data={points}
            stackOffset="sign"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <YAxis type="number" domain={['dataMin', 'dataMax']} hide />
            <Tooltip content={<CustomTooltip />} />
            {visibleParts.length > 0 && (
              <ReferenceLine y={0} stroke={theme.palette.divider} />
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
      </Box>

      <Box p={2}>
        {makeCheck('fundsInBudget')}
        {makeCheck('fundsSaving')}
        {makeCheck('accountDebts')}
        {makeCheck('debts')}
        {makeCheck('lented')}
        {makeCheck('total')}
      </Box>
    </Paper>
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
  const [currency] = displayCurrency.useDisplayCurrency()
  const payload = props.payload as TPayload[]
  const active = props.active as boolean
  if (!active || !payload?.length) return null
  const date = payload[0]?.payload?.date
  const values = payload.filter(v => v.value)
  return (
    <Card elevation={10} sx={{ p: 2 }}>
      <Typography variant="h6">
        {capitalize(formatDate(date, 'LLLL yyyy'))}
      </Typography>
      {values.map(v => (
        <DataLine
          color={v.color}
          key={v.dataKey}
          name={v.name}
          amount={v.value}
          currency={currency}
        />
      ))}
    </Card>
  )
}

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

import React from 'react'
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { withStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import {
  ResponsiveContainer,
  ComposedChart,
  YAxis,
  Tooltip,
  Bar,
  Line,
  ReferenceLine,
} from 'recharts'
import {
  getInBudgetAccounts,
  getSavingAccounts,
} from 'store/localData/accounts'
import { convertCurrency } from 'store/data/selectors'
import { getAvailableMonths } from './availablePeriod'
import { getBalanceChanges, getBalancesOnDate } from './getBalanceChanges'
import { round } from 'helpers/currencyHelpers'
import { useState } from 'react'
import { formatMoney, formatDate } from 'helpers/format'
import { Amount } from 'components/Amount'

export function NetWorth() {
  const theme = useTheme()
  const months = useSelector(getAvailableMonths)
  const balanceChanges = useSelector(getBalanceChanges)
  const accsInBudget = useSelector(getInBudgetAccounts)
  const accsSaving = useSelector(getSavingAccounts)
  const convert = useSelector(convertCurrency)

  const [inBudget, setInBudget] = useState(true)
  const [savings, setSavings] = useState(true)
  const [debts, setDebts] = useState(true)
  const [loans, setLoans] = useState(true)
  const [credits, setCredits] = useState(true)
  const [total, setTotal] = useState(true)

  const [filterMode, setFilterMode] = useState<'lastYear' | 'all'>('lastYear')
  const startDate = filterMode === 'lastYear' ? months.slice(-12)[0] : months[0]

  const balances = months
    .filter(month => +month >= +startDate)
    .map(date => ({
      ...getBalancesOnDate(balanceChanges, +date),
      // Set date as start of the month
      date: new Date(date.getFullYear(), date.getMonth(), 1),
    }))

  const points = balances.map((b, i) => {
    let point = {
      date: new Date(b.date),
      positiveInBudget: 0,
      positiveSaving: 0,
      positivePotential: 0,
      negativeDebts: 0,
      negativeLoans: 0,
      negativeCredits: 0,
      get positiveTotal(): number {
        return round(this.positiveInBudget + this.positiveSaving)
      },
      get negativeTotal(): number {
        return round(
          this.negativeDebts + this.negativeLoans + this.negativeCredits
        )
      },
      get total(): number {
        return round(this.positiveTotal + this.negativeTotal)
      },
    }
    accsInBudget.concat(accsSaving).forEach(acc => {
      const accBalance = b?.accounts?.[acc.id] || 0
      const convertedBalance = convert(accBalance, acc.instrument)
      if (convertedBalance > 0) {
        if (acc.inBudget) point.positiveInBudget += convertedBalance
        else point.positiveSaving += convertedBalance
      }
      if (convertedBalance < 0) {
        if (acc.type === 'loan') point.negativeLoans += convertedBalance
        else point.negativeCredits += convertedBalance
      }
    })
    Object.entries(b?.debtors || {}).forEach(([debtorId, balance]) => {
      const instrument = debtorId.split('-')[1]
      const debtorBalance = convert(balance, instrument)
      if (debtorBalance > 0) {
        // He owes me
        point.positivePotential += debtorBalance
      }
      if (debtorBalance < 0) {
        // I owe him
        point.negativeDebts += debtorBalance
      }
    })

    return point
  })

  // Remove disabled to show correct total
  points.forEach(p => {
    if (!inBudget) p.positiveInBudget = 0
    if (!savings) p.positiveSaving = 0
    if (!debts) p.negativeDebts = 0
    if (!loans) p.negativeLoans = 0
    if (!credits) p.negativeCredits = 0
  })

  const tooltipStyle = {
    padding: 0,
    margin: 0,
    lineheight: 1,
  }
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!payload?.[0]) return null
    const date = payload[0]?.payload?.date
    const values = [
      { name: 'Всего', value: payload?.[5]?.value },
      { name: 'Бюджет', value: payload?.[0]?.value },
      { name: 'Сбережения', value: payload?.[1]?.value },
      { name: 'Долги', value: payload?.[2]?.value },
      { name: 'Кредиты', value: payload?.[3]?.value },
      { name: 'Карты', value: payload?.[4]?.value },
    ].filter(v => v.value)
    return (
      <div
        style={{
          borderRadius: theme.shape.borderRadius,
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          padding: theme.spacing(1),
          border: 0,
          boxShadow: theme.shadows[10],
        }}
      >
        <p style={tooltipStyle}>{capitalize(formatDate(date, 'LLLL yyyy'))}</p>
        {values.map(v => (
          <p key={v.name} style={tooltipStyle}>
            {v.name}:{' '}
            <Amount
              style={{
                color: v.value < 0 ? theme.palette.error.main : 'inherit',
              }}
              value={v.value}
              instrument="user"
              decMode="ifAny"
              noShade
            />
          </p>
        ))}
      </div>
    )
  }

  return (
    <Paper>
      <Box p={2} minWidth="100%">
        <Typography variant="h5">
          Рост капитала{' '}
          <span
            style={{ color: theme.palette.secondary.main, cursor: 'pointer' }}
            onClick={() => {
              setFilterMode(mode => (mode === 'all' ? 'lastYear' : 'all'))
            }}
          >
            {filterMode === 'all' ? 'за всё время' : 'за год'}
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
            <Tooltip
              formatter={(v: number) => formatMoney(v)}
              contentStyle={{
                borderRadius: theme.shape.borderRadius,
                background: theme.palette.background.paper,
                color: theme.palette.text.primary,
                padding: theme.spacing(1),
                border: 0,
                boxShadow: theme.shadows[10],
              }}
              itemStyle={{
                color: theme.palette.text.primary,
              }}
              content={<CustomTooltip />}
            />
            {/* <CartesianGrid stroke={theme.palette.divider} /> */}
            <ReferenceLine y={0} stroke={theme.palette.divider} />

            {inBudget && (
              <Bar
                dataKey="positiveInBudget"
                stackId="a"
                fill={theme.palette.primary.dark}
                isAnimationActive={false}
              />
            )}
            {savings && (
              <Bar
                dataKey="positiveSaving"
                stackId="a"
                fill={theme.palette.primary.light}
                isAnimationActive={false}
              />
            )}
            {debts && (
              <Bar
                dataKey="negativeDebts"
                stackId="a"
                fill={theme.palette.error.dark}
                isAnimationActive={false}
              />
            )}
            {credits && (
              <Bar
                dataKey="negativeCredits"
                stackId="a"
                fill={theme.palette.error.main}
                isAnimationActive={false}
              />
            )}
            {loans && (
              <Bar
                dataKey="negativeLoans"
                stackId="a"
                fill={theme.palette.error.light}
                isAnimationActive={false}
              />
            )}
            {total && (
              <Line
                type="monotone"
                dataKey="total"
                stroke={theme.palette.info.main}
                isAnimationActive={false}
                dot={false}
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      <Box p={2}>
        <FormControlLabel
          control={
            <CheckboxInBudget
              checked={inBudget}
              onChange={() => setInBudget(v => !v)}
            />
          }
          label="Деньги в бюджете"
        />
        <FormControlLabel
          control={
            <CheckboxSavings
              color="default"
              checked={savings}
              onChange={() => setSavings(v => !v)}
            />
          }
          label="Деньги вне бюджета"
        />
        <FormControlLabel
          control={
            <CheckboxDebts checked={debts} onChange={() => setDebts(v => !v)} />
          }
          label="Долги"
        />
        <FormControlLabel
          control={
            <CheckboxCredits
              checked={credits}
              onChange={() => setCredits(v => !v)}
            />
          }
          label="Задолженности по счетам"
        />
        <FormControlLabel
          control={
            <CheckboxLoans checked={loans} onChange={() => setLoans(v => !v)} />
          }
          label="Кредиты и ипотеки"
        />
        <FormControlLabel
          control={
            <CheckboxTotal checked={total} onChange={() => setTotal(v => !v)} />
          }
          label="Итого"
        />
      </Box>
    </Paper>
  )
}

const CheckboxInBudget = withStyles(theme => ({
  root: {
    color: theme.palette.primary.dark,
    '&$checked': { color: theme.palette.primary.dark },
  },
  checked: {},
}))(Checkbox)

const CheckboxSavings = withStyles(theme => ({
  root: {
    color: theme.palette.primary.light,
    '&$checked': { color: theme.palette.primary.light },
  },
  checked: {},
}))(Checkbox)

const CheckboxDebts = withStyles(theme => ({
  root: {
    color: theme.palette.error.dark,
    '&$checked': { color: theme.palette.error.dark },
  },
  checked: {},
}))(Checkbox)

const CheckboxCredits = withStyles(theme => ({
  root: {
    color: theme.palette.error.main,
    '&$checked': { color: theme.palette.error.main },
  },
  checked: {},
}))(Checkbox)

const CheckboxLoans = withStyles(theme => ({
  root: {
    color: theme.palette.error.light,
    '&$checked': { color: theme.palette.error.light },
  },
  checked: {},
}))(Checkbox)

const CheckboxTotal = withStyles(theme => ({
  root: {
    color: theme.palette.info.main,
    '&$checked': { color: theme.palette.info.main },
  },
  checked: {},
}))(Checkbox)

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

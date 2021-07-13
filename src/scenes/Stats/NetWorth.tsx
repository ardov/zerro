import React from 'react'
import { Box, Typography, Paper, useTheme } from '@material-ui/core'
import { useSelector } from 'react-redux'
import {
  Area,
  ResponsiveContainer,
  ComposedChart,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
} from 'recharts'
import {
  getInBudgetAccounts,
  getSavingAccounts,
} from 'store/localData/accounts'
import { convertCurrency } from 'store/data/selectors'
import { getAvailableMonths } from './availablePeriod'
import { getBalanceChanges, getBalancesOnDate } from './getBalanceChanges'

export function NetWorth() {
  const theme = useTheme()
  const months = useSelector(getAvailableMonths)
  const balanceChanges = useSelector(getBalanceChanges)
  const accsInBudget = useSelector(getInBudgetAccounts)
  const accsSaving = useSelector(getSavingAccounts)
  const convert = useSelector(convertCurrency)

  const balances = months.map(date => getBalancesOnDate(balanceChanges, +date))
  console.log({ balances })

  const points = balances.map((b, i) => {
    let point = {
      date: months[i],

      positiveInBudget: 0,
      positiveSaving: 0,

      positivePotential: 0,

      negativeDebts: 0,
      negativeLoans: 0,
      negativeCredits: 0,

      get positiveTotal(): number {
        return this.positiveInBudget + this.positiveSaving
      },
      get negativeTotal(): number {
        return this.negativeDebts + this.negativeLoans + this.negativeCredits
      },
      get total(): number {
        return this.positiveTotal + this.negativeTotal
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
    Object.values(b?.merchants || {}).forEach(byInst => {
      Object.entries(byInst).forEach(([instrument, balance]) => {
        const convertedBalance = convert(balance, instrument)
        if (convertedBalance > 0) {
          point.positivePotential += convertedBalance
        }
        if (convertedBalance < 0) {
          point.negativeDebts += convertedBalance
        }
      })
    })
    Object.values(b?.payees || {}).forEach(byInst => {
      Object.entries(byInst).forEach(([instrument, balance]) => {
        const convertedBalance = convert(balance, instrument)
        if (convertedBalance > 0) {
          point.positivePotential += convertedBalance
        }
        if (convertedBalance < 0) {
          point.negativeDebts += convertedBalance
        }
      })
    })

    return point
  })

  return (
    <Paper>
      <Box p={2} minWidth="100%">
        <Typography variant="h5">Мой капитал</Typography>
      </Box>
      <Box p={2} minWidth="100%" height={300}>
        <ResponsiveContainer>
          <ComposedChart
            data={points}
            stackOffset="sign"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <YAxis type="number" domain={['dataMin', 'dataMax']} hide />
            <Tooltip />
            <CartesianGrid stroke={theme.palette.divider} />

            <Area
              type="monotone"
              dataKey="total"
              fill={theme.palette.info.light}
              stroke={theme.palette.info.dark}
            />
            <Bar
              dataKey="positiveInBudget"
              stackId="a"
              fill={theme.palette.success.main}
            />
            <Bar
              dataKey="positiveSaving"
              stackId="a"
              fill={theme.palette.success.dark}
            />
            <Bar
              dataKey="negativeTotal"
              stackId="b"
              fill={theme.palette.error.main}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}

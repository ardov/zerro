import React, { useState, useCallback } from 'react'
import { Box, Typography, Paper, useTheme } from '@material-ui/core'
import { useSelector } from 'react-redux'
import {
  Area,
  ResponsiveContainer,
  ComposedChart,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Bar,
} from 'recharts'
import { getAccountsHistory } from './selectors'
import {
  getInBudgetAccounts,
  getSavingAccounts,
} from 'store/localData/accounts'
import { formatMoney, formatDate } from 'helpers/format'
import Rhythm from 'components/Rhythm'
import { TransactionsDrawer } from 'components/TransactionsDrawer'
import { convertCurrency } from 'store/data/selectors'

type DataPoint = {
  date: number
  positive: number
  negative: number
  total: number
}

export function NetWorth() {
  const theme = useTheme()
  const accsInBudget = useSelector(getInBudgetAccounts)
  const accsSaving = useSelector(getSavingAccounts)
  const balanceHistory = useSelector(getAccountsHistory)
  const convert = useSelector(convertCurrency)

  let data: DataPoint[] = []

  accsInBudget.concat(accsSaving).forEach(acc => {
    let history = balanceHistory[acc.id]
    const byMonth = history.filter((point, i, arr) => {
      const currentDate = new Date(point.date)
      const nextDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 1
      )
      const isLast = i === arr.length - 1
      const isLastOfMonth = currentDate.getMonth() !== nextDate.getMonth()
      return isLast || isLastOfMonth
    })
    if (!data.length) {
      data = byMonth.map(point => ({
        date: point.date,
        positive: 0,
        negative: 0,
        total: 0,
      }))
    }
    byMonth.forEach((point, i) => {
      let convertedBalance = convert(point.balance, acc.instrument)
      if (convertedBalance > 0) {
        data[i].positive += convertedBalance
      }
      if (convertedBalance < 0) {
        data[i].negative += convertedBalance
      }
      data[i].total += convertedBalance
    })
  })

  console.log(data)

  return (
    <Paper>
      <Box p={2} minWidth="100%" height={300}>
        <ResponsiveContainer>
          <ComposedChart data={data} stackOffset="sign">
            {/* <XAxis dataKey="name" /> */}
            <YAxis />
            <Tooltip />
            <Legend />
            <CartesianGrid stroke={theme.palette.divider} />
            <Area
              type="monotone"
              dataKey="total"
              fill={theme.palette.info.light}
              stroke={theme.palette.info.dark}
            />
            <Bar
              dataKey="positive"
              stackId="a"
              barSize={8}
              fill={theme.palette.success.main}
            />
            <Bar
              dataKey="negative"
              stackId="a"
              barSize={8}
              fill={theme.palette.error.main}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}

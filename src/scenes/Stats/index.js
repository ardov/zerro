import React, { useState, useEffect } from 'react'
import TransactionList from 'components/TransactionList'
import {
  Box,
  Drawer,
  useMediaQuery,
  Typography,
  Paper,
} from '@material-ui/core'
import sendEvent from 'helpers/sendEvent'
import { useSelector } from 'react-redux'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getTotalsByMonth } from 'scenes/Budgets/selectors/getTotalsByMonth'
import { getAmountsByTag } from 'scenes/Budgets/selectors/getAmountsByTag'
import { format } from 'date-fns'
import { getAccountsHistory } from './selectors'
import { getAccounts } from 'store/localData/accounts'
import { formatMoney } from 'helpers/format'

const getMonthDatesFrom = (date = new Date(), num = 6) => {
  let month = date.getMonth()
  const year = date.getFullYear()
  const arr = []
  for (let mm = month; mm > month - num; mm--) {
    arr.push(+new Date(year, mm))
  }
  return arr.reverse()
}

export default function Stats() {
  const rawData = useSelector(getTotalsByMonth)
  const accountsHistory = useSelector(getAccountsHistory)
  const accs = useSelector(getAccounts)

  const tagData = useSelector(getAmountsByTag)
  const data = rawData.map(obj => ({
    ...obj,
    date: format(obj.date, 'MM-yyyy'),
  }))
  // console.log(data)
  console.log(accountsHistory)
  // console.log(tagData)
  // console.log(getMonthDatesFrom())
  const accIds = Object.keys(accs)

  return (
    <Box display="flex" flexDirection="column">
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="income" />
            <Area type="monotone" dataKey="outcome" fill="red" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="outcome" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {accIds.map(id => (
        <Box p={3} key={id}>
          <AccHist key={id} id={id} />
        </Box>
      ))}
    </Box>
  )
}

const AccHist = ({ id }) => {
  const history = useSelector(getAccountsHistory)[id]
  const acc = useSelector(getAccounts)[id]

  return (
    <Paper>
      <Box p={3}>{acc.title}</Box>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart
            data={history}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            {/* <XAxis
              dataKey="date"
              tickFormatter={date => format(date, 'dd-MM-yyyy')}
            />
            <YAxis /> */}
            <Tooltip
              labelFormatter={date => format(date, 'dd-MM-yyyy')}
              formatter={val => formatMoney(val)}
            />
            <Area type="monotone" dataKey="balance" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Paper>
  )
}

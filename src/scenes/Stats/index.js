import React, { useState, useEffect, useCallback } from 'react'
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
import { getAccounts, getAccountList } from 'store/localData/accounts'
import { formatMoney } from 'helpers/format'
import Rhythm from 'components/Rhythm'
import TransactionsDrawer from 'components/TransactionsDrawer'

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
  const accs = useSelector(getAccountList)
  const [selected, setSelected] = useState({})

  const tagData = useSelector(getAmountsByTag)
  const data = rawData.map(obj => ({
    ...obj,
    date: format(obj.date, 'MM-yyyy'),
  }))
  // console.log(data)
  console.log(accountsHistory)
  // console.log(tagData)
  // console.log(getMonthDatesFrom())
  const startDate = +new Date(2020, 0)
  const accIds = accs.filter(acc => !acc.archive).map(acc => acc.id)

  const onSelect = useCallback((id, date) => {
    setSelected({ id, date })
  }, [])

  const filterConditions = {
    accounts: [selected.id],
    dateFrom: selected.date,
    dateTo: selected.date,
  }

  return (
    <>
      <Box display="flex" flexDirection="column">
        {/* <div style={{ width: '100%', height: 300 }}>
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
      </div> */}
        <Rhythm gap={2} axis="y" p={3}>
          {accIds.map(id => (
            <AccHist
              key={id}
              id={id}
              startDate={startDate}
              onClick={onSelect}
            />
          ))}
        </Rhythm>
      </Box>

      <TransactionsDrawer
        filterConditions={filterConditions}
        open={!!selected.date && !!selected.id}
        onClose={() => setSelected({})}
      />
    </>
  )
}

const AccHist = ({ id, startDate = 0, endDate, onClick }) => {
  const history = useSelector(getAccountsHistory)[id]
  const acc = useSelector(getAccounts)[id]
  console.log(startDate)

  const data = history.filter(({ date }) => date >= startDate)

  return (
    <Paper style={{ overflow: 'hidden' }}>
      <Box pt={2} px={2}>
        <Typography variant="h5">{acc.title}</Typography>
      </Box>
      <div style={{ width: '100%', height: 80 }}>
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            onClick={e => {
              const date = data[e.activeLabel].date
              onClick(id, date)
            }}
          >
            {/* <XAxis
              dataKey="date"
              tickFormatter={date => format(date, 'dd-MM-yyyy')}
            />
            <YAxis /> */}
            <Tooltip
              labelFormatter={idx => format(data[idx].date, 'dd-MM-yyyy')}
              formatter={val => formatMoney(val)}
            />
            <Area type="monotone" dataKey="balance" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Paper>
  )
}

import React, { useState, useCallback } from 'react'
import { Box, Typography, Paper } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

// import { getTotalsArray } from 'scenes/Budgets/selectors/getTotalsArray'
// import { getAmountsByTag } from 'scenes/Budgets/selectors/getAmountsByTag'
import { getAccountsHistory } from './selectors'
import { getAccounts, getAccountList } from 'store/localData/accounts'
import { formatMoney, formatDate } from 'helpers/format'
import Rhythm from 'components/Rhythm'
import TransactionsDrawer from 'components/TransactionsDrawer'

export default function Stats() {
  // const rawData = useSelector(getTotalsArray)
  // const accountsHistory = useSelector(getAccountsHistory)
  const accs = useSelector(getAccountList)
  const [selected, setSelected] = useState({})

  // const tagData = useSelector(getAmountsByTag)
  // const data = rawData.map(obj => ({
  //   ...obj,
  //   date: formatDate(obj.date, 'MM-yyyy'),
  // }))
  // console.log(data)
  // console.log(accountsHistory)
  // console.log(tagData)

  const startDate = +new Date(2019, 0)
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
  const [hoverIdx, setHoverIdx] = useState(null)
  // const [startIndex, setStartIndex] = useState(
  //   history.findIndex(day => day.date === startDate) || 0
  // )

  const data = history.filter(({ date }) => date >= startDate)

  const isHovering = !!hoverIdx || hoverIdx === 0
  const balance = isHovering ? data[hoverIdx].balance : acc.balance
  const hoverDate = isHovering ? data[hoverIdx].date : null

  const gradientOffset = () => {
    const dataMax = Math.max(...data.map(i => i.balance))
    const dataMin = Math.min(...data.map(i => i.balance))

    if (dataMax <= 0) return 0
    if (dataMin >= 0) return 1

    return dataMax / (dataMax - dataMin)
  }

  const off = gradientOffset()
  const colorId = 'gradient' + acc.id

  return (
    <Paper style={{ overflow: 'hidden', position: 'relative' }}>
      <Box pt={2} px={2} minWidth={160}>
        <Typography variant="body2" onClick={() => console.log(acc)}>
          {acc.title} {isHovering && formatDate(hoverDate)}
        </Typography>
        <Typography variant="h6">{formatMoney(balance)}</Typography>
      </Box>
      <div
        style={{
          width: '100%',
          position: 'absolute',
          // height: 80,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            onClick={e => {
              if (!e) return
              const date = data[e.activeLabel].date
              onClick(id, date)
            }}
            onMouseMove={e => e && setHoverIdx(e.activeLabel ?? null)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id={colorId} x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#000" stopOpacity={0.1} />
                <stop offset={off} stopColor="#f00" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            {/* <XAxis
              dataKey="date"
              tickFormatter={date => formatDate(date, 'dd-MM-yyyy')}
            />
            <YAxis /> */}
            <Tooltip
              active={false}
              wrapperStyle={{ display: 'none' }}
              labelFormatter={idx => {
                const date = data?.[idx]?.date || 0
                return formatDate(date)
              }}
              formatter={val => formatMoney(val)}
              allowEscapeViewBox={{ x: false, y: true }}
              cursor={false}
            />

            <Area
              type="monotone"
              stroke="none"
              fill={`url(#${colorId})`}
              fillOpacity={1}
              dataKey="balance"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Paper>
  )
}

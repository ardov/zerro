import React, { useState, useCallback } from 'react'
import { Box, Typography, Paper, useTheme } from '@mui/material'
import { useAppSelector } from 'store'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { getAccountsHistory } from './selectors'
import { getAccounts, getAccountList } from 'store/data/accounts'
import { formatMoney, formatDate } from 'shared/helpers/format'
import Rhythm from 'components/Rhythm'
import { TransactionsDrawer } from 'components/TransactionsDrawer'
import { NetWorth } from './NetWorth'
import { InAndOut } from './InAndOut'

export default function Stats() {
  const accs = useAppSelector(getAccountList)
  const [selected, setSelected] = useState({})

  const startDate = +new Date(2019, 0)
  const accIds = accs
    .sort((acc1, acc2) => {
      if (acc1.archive && acc2.archive) return 0
      if (acc1.archive) return 1
      if (acc2.archive) return -1
      return 0
    })
    .map(acc => acc.id)

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
        <Rhythm gap={2} axis="y" p={3}>
          <NetWorth />
          <InAndOut />
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
  const theme = useTheme()
  const history = useAppSelector(getAccountsHistory)[id]
  const acc = useAppSelector(getAccounts)[id]
  const [hoverIdx, setHoverIdx] = useState(null)

  const diff = Math.abs(history[history.length - 1].balance - acc.balance)
  const hasError = diff > 0.001 && acc.type !== 'debt'

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
      <Box p={2} minWidth={160}>
        <Typography variant="body2" onClick={() => console.log(acc)}>
          {hasError && <span>⚠️ Ошибка на {formatMoney(diff)}⚠️ </span>}
          <span
            style={{ textDecoration: acc.archive ? 'line-through' : 'none' }}
          >
            {acc.title}
          </span>{' '}
          {isHovering && formatDate(hoverDate)}
        </Typography>
        <Typography variant="h6">{formatMoney(balance)}</Typography>
      </Box>

      <div
        style={{
          width: '100%',
          position: 'absolute',
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
              console.log({ history, acc })
              onClick(id, date)
            }}
            onMouseMove={e => e && setHoverIdx(e.activeLabel ?? null)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id={colorId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset={off}
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0.2}
                />
                <stop
                  offset={off}
                  stopColor={theme.palette.error.main}
                  stopOpacity={0.3}
                />
              </linearGradient>
            </defs>

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

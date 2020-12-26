import React, { useState, useCallback } from 'react'
import { Box, Typography, Paper } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

import { getAccountsHistory, getYearStats } from './selectors'
import { getAccounts, getAccountList } from 'store/localData/accounts'
import { formatMoney, formatDate } from 'helpers/format'
import Rhythm from 'components/Rhythm'
import TransactionsDrawer from 'components/TransactionsDrawer'

export default function Stats() {
  const accs = useSelector(getAccountList)
  const yearStats = useSelector(getYearStats)
  const [selected, setSelected] = useState({})

  console.log('yearStats', yearStats)

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
        <Rhythm gap={2} axis="y" p={3}>
          <OutcomeCard transaction={yearStats.total.outcomeTransactions[0]} />
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

function OutcomeCard({ transaction }) {
  return (
    <Box
      bgcolor="background.paper"
      maxWidth={480}
      borderRadius={16}
      p={3}
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Typography variant="h5" align="center">
        Самая крупная покупка этого года
      </Typography>
      {transaction.outcome}
      Ghbdtn
    </Box>
  )
}

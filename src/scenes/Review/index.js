import React, { useState } from 'react'
import { Box, Typography } from '@material-ui/core'
import { useSelector } from 'react-redux'
import './index.scss'
import { getAccountsHistory, getYearStats } from './selectors'
import { getAccounts, getAccountList } from 'store/localData/accounts'
import Rhythm from 'components/Rhythm'
import TransactionsDrawer from 'components/TransactionsDrawer'
import { OutcomeCard } from './cards/OutcomeCard'
import { NoCategoryCard } from './cards/NoCategoryCard'
import { QRCard } from './cards/QRCard'
import { PayeeByOutcomeCard } from './cards/PayeeByOutcomeCard'
import { PayeeByFrequencyCard } from './cards/PayeeByFrequencyCard'
import { IncomeCard } from './cards/IncomeCard'
import { Card } from './cards/Card'

export default function Review() {
  const [year, setYear] = useState(2020)
  const yearStats = useSelector(getYearStats(year))
  console.log('yearStats', yearStats)
  const [selected, setSelected] = useState({})

  if (!yearStats) return null
  const { total, byTag, receipts, byPayee } = yearStats

  const noCategoryValue = byTag.null
    ? byTag.null.incomeTransactions.length +
      byTag.null.outcomeTransactions.length
    : 0

  const filterConditions = {
    accounts: [selected.id],
    dateFrom: selected.date,
    dateTo: selected.date,
  }

  return (
    <>
      <Box className="container">
        <Rhythm gap={2} axis="y" p={3}>
          <CardTitle year={year} setYear={setYear} />
          <IncomeCard byTag={byTag} />
          <PayeeByOutcomeCard byPayee={byPayee} />
          <PayeeByFrequencyCard byPayee={byPayee} />
          <OutcomeCard transaction={total.outcomeTransactions[0]} />
          <QRCard value={receipts} />
          <NoCategoryCard value={noCategoryValue} />
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

function CardTitle({ year, setYear }) {
  return (
    <Card onClick={() => setYear(year - 1)}>
      <Typography
        variant="body1"
        align="center"
        color="textSecondary"
        className="results"
      >
        ИТОГИ ГОДА
      </Typography>
      <Box position="relative">
        <Typography variant="h1" align="center" className="year">
          <b>{year}</b>
        </Typography>
        <Typography variant="h1" align="center" className="year shadow">
          <b>{year}</b>
        </Typography>
      </Box>
    </Card>
  )
}

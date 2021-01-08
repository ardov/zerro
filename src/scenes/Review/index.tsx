import React, { useState } from 'react'
import { Box, Button, Typography } from '@material-ui/core'
import { useSelector } from 'react-redux'
import './index.scss'
import { getYearStats } from './selectors'
// import { getAccounts, getAccountList } from 'store/localData/accounts'
import Rhythm from 'components/Rhythm'
import { OutcomeCard } from './cards/OutcomeCard'
import { NoCategoryCard } from './cards/NoCategoryCard'
import { QRCard } from './cards/QRCard'
import { PayeeByOutcomeCard } from './cards/PayeeByOutcomeCard'
import { PayeeByFrequencyCard } from './cards/PayeeByFrequencyCard'
import { IncomeCard } from './cards/IncomeCard'
import { Card } from './cards/Card'
// import { getBalanceChanges, accountBalanceGetter } from './getAccountHistory'

export default function Review() {
  const [year, setYear] = useState(2020)
  const yearStats = useSelector(getYearStats(year))
  // const balanceChanges = useSelector(getBalanceChanges)
  // const accs = useSelector(getAccountList)
  // const getBalance = useSelector(accountBalanceGetter)
  // console.log('yearStats', yearStats)
  // console.log('balanceChanges', balanceChanges)

  // const dat = accs.map(acc => ({
  //   id: acc.id,
  //   title: acc.title,
  //   '2000-01-01': getBalance(acc.id, +new Date(2000, 0, 1)),
  //   '2020-01-01': getBalance(acc.id, +new Date(2020, 0, 1)),
  //   '2021-01-01': getBalance(acc.id, +new Date(2021, 0, 1)),
  //   '2030-01-01': getBalance(acc.id, +new Date(2030, 0, 1)),
  //   history: balanceChanges.byAccount[acc.id],
  // }))
  // console.table(dat)

  if (!yearStats) return null
  const { total, byTag, receipts, byPayee } = yearStats

  const noCategoryValue = byTag.null
    ? byTag.null.incomeTransactions.length +
      byTag.null.outcomeTransactions.length
    : 0

  return (
    <Box className="container">
      <Rhythm gap={2} axis="y" p={3} pb={10}>
        <CardTitle year={year} />
        <IncomeCard byTag={byTag} />
        <PayeeByOutcomeCard byPayee={byPayee} />
        <PayeeByFrequencyCard byPayee={byPayee} />
        <OutcomeCard transaction={total.outcomeTransactions[0]} />
        <QRCard value={receipts} />
        <NoCategoryCard value={noCategoryValue} />
        <Button onClick={() => setYear(year - 1)}>
          А что было в прошлом году?
        </Button>
      </Rhythm>
    </Box>
  )
}

function CardTitle({ year }: { year: number }) {
  return (
    <Card>
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

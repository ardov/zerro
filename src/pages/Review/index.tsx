import React, { useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import './index.scss'
import { TTransaction } from '@shared/types'
import { TransactionsDrawer } from '@components/TransactionsDrawer'

import { OutcomeCard } from './cards/OutcomeCard'
import { NoCategoryCard } from './cards/NoCategoryCard'
import { QRCard } from './cards/QRCard'
import { PayeeByOutcomeCard } from './cards/PayeeByOutcomeCard'
import { PayeeByFrequencyCard } from './cards/PayeeByFrequencyCard'
import { IncomeCard } from './cards/IncomeCard'
import { Card } from './shared/Card'
import { NotFunCard } from './cards/NotFunCard'

// New report unlocks in december
const currMonth = new Date().getMonth()
const currYear = new Date().getFullYear()
const startingYear = currMonth >= 11 ? currYear : currYear - 1

export default function Review() {
  const [year, setYear] = useState(startingYear)
  const [isOpenTrList, toogleTrList] = useState(false)
  const [transactions, setTransactions] = useState<TTransaction[]>([])

  function showTransactions(list: TTransaction[]) {
    setTransactions(list)
    toogleTrList(true)
  }

  return (
    <>
      <Box className="container">
        <Stack spacing={2} p={3} pb={10}>
          <CardTitle year={year} />
          <IncomeCard year={year} onShowTransactions={showTransactions} />
          <NotFunCard year={year} onShowTransactions={showTransactions} />
          <PayeeByOutcomeCard
            year={year}
            onShowTransactions={showTransactions}
          />
          <PayeeByFrequencyCard
            year={year}
            onShowTransactions={showTransactions}
          />
          <OutcomeCard year={year} onShowTransactions={showTransactions} />
          <QRCard year={year} onShowTransactions={showTransactions} />
          <NoCategoryCard year={year} onShowTransactions={showTransactions} />
          <Button onClick={() => setYear(y => y - 1)}>
            А что было в прошлом году?
          </Button>
        </Stack>
      </Box>

      <TransactionsDrawer
        open={isOpenTrList}
        onClose={() => toogleTrList(false)}
        transactions={transactions}
      />
    </>
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

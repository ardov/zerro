import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Stack, Typography } from '@mui/material'
import './index.scss'
import { TTransaction } from '6-shared/types'

import { useTransactionDrawer } from '3-widgets/global/TransactionListDrawer'
import { OutcomeCard } from './cards/OutcomeCard'
import { NoCategoryCard } from './cards/NoCategoryCard'
import { QRCard } from './cards/QRCard'
import { PayeeByOutcomeCard } from './cards/PayeeByOutcomeCard'
import { PayeeByFrequencyCard } from './cards/PayeeByFrequencyCard'
import { IncomeCard } from './cards/IncomeCard'
import { Card } from './shared/Card'
import { NotFunCard } from './cards/NotFunCard'
import { OutcomeStatCard } from './cards/OutcomeStatCard'
import { SavingsCard } from './cards/SavingsCard'

// New report unlocks in december
const currMonth = new Date().getMonth()
const currYear = new Date().getFullYear()
const startingYear = currMonth >= 11 ? currYear : currYear - 1

export default function Review() {
  const { t } = useTranslation('yearReview')
  const [year, setYear] = useState(startingYear)
  const trDrawer = useTransactionDrawer()

  function showTransactions(list: TTransaction[]) {
    trDrawer.open({ transactions: list })
  }

  return (
    <Box className="container">
      <Stack
        spacing={2}
        sx={{
          p: 3,
          pb: 10,
        }}
      >
        <CardTitle year={year} />
        <IncomeCard year={year} onShowTransactions={showTransactions} />
        <SavingsCard year={year} onShowTransactions={showTransactions} />
        <NotFunCard year={year} onShowTransactions={showTransactions} />
        <PayeeByOutcomeCard year={year} onShowTransactions={showTransactions} />
        <PayeeByFrequencyCard
          year={year}
          onShowTransactions={showTransactions}
        />
        <OutcomeCard year={year} onShowTransactions={showTransactions} />
        <OutcomeStatCard year={year} onShowTransactions={showTransactions} />
        <QRCard year={year} onShowTransactions={showTransactions} />
        <NoCategoryCard year={year} onShowTransactions={showTransactions} />
        <Button onClick={() => setYear(y => y - 1)}>
          {t('whatWasInPreviousYear')}
        </Button>
      </Stack>
    </Box>
  )
}

function CardTitle({ year }: { year: number }) {
  const { t } = useTranslation('yearReview')
  return (
    <Card>
      <Typography
        variant="body1"
        align="center"
        className="results"
        sx={{
          color: 'text.secondary',
        }}
      >
        {t('yearReview')}
      </Typography>
      <Box
        sx={{
          position: 'relative',
        }}
      >
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

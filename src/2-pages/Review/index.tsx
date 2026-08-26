import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@mui/material'
import './index.scss'
import type { TTransaction } from '6-shared/types'

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
    <>
      <title>{`${t('pageTitle')} | Zerro`}</title>
      <div className="container">
        <div className="flex flex-col gap-4 p-6 pb-20">
          <CardTitle year={year} />
          <IncomeCard year={year} onShowTransactions={showTransactions} />
          <SavingsCard year={year} onShowTransactions={showTransactions} />
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
          <OutcomeStatCard year={year} onShowTransactions={showTransactions} />
          <QRCard year={year} onShowTransactions={showTransactions} />
          <NoCategoryCard year={year} onShowTransactions={showTransactions} />
          <Button onClick={() => setYear(y => y - 1)}>
            {t('whatWasInPreviousYear')}
          </Button>
        </div>
      </div>
    </>
  )
}

function CardTitle({ year }: { year: number }) {
  const { t } = useTranslation('yearReview')
  return (
    <Card>
      <p className="results m-0 text-center type-body text-muted-foreground">
        {t('yearReview')}
      </p>
      <div className="relative">
        <h1 className="year m-0 text-center text-[6rem] leading-[1.167] font-light">
          <b>{year}</b>
        </h1>
        <p className="year shadow m-0 text-center text-[6rem] leading-[1.167] font-light">
          <b>{year}</b>
        </p>
      </div>
    </Card>
  )
}

import React, { useState } from 'react'
import { Box } from '@material-ui/core'
import { useSelector } from 'react-redux'
import './index.scss'
import { getAccountsHistory, getYearStats } from './selectors'
import { getAccounts, getAccountList } from 'store/localData/accounts'
import Rhythm from 'components/Rhythm'
import TransactionsDrawer from 'components/TransactionsDrawer'
import { OutcomeCard } from './OutcomeCard'
import { NoCategoryCard } from './NoCategoryCard'
import { QRCard } from './QRCard'
import { PayeeByOutcomeCard } from './PayeeByOutcomeCard'
import { PayeeByFrequencyCard } from './PayeeByFrequencyCard'
import { IncomeCard } from './IncomeCard'

export default function Stats() {
  const yearStats = useSelector(getYearStats)
  console.log('yearStats', yearStats)
  const [selected, setSelected] = useState({})

  if (!yearStats) return null
  const { total, byTag, receipts, byPayee } = yearStats

  const noCategoryValue =
    byTag.null.incomeTransactions.length + byTag.null.outcomeTransactions.length

  const filterConditions = {
    accounts: [selected.id],
    dateFrom: selected.date,
    dateTo: selected.date,
  }

  return (
    <>
      <Box className="container">
        <Rhythm gap={2} axis="y" p={3}>
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

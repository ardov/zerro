import React, { useState, useCallback } from 'react'
import { Box } from '@mui/material'
import { TAccountId, TISODate } from '@shared/types'
import Rhythm from '@shared/ui/Rhythm'

import { accountModel } from '@entities/account'
import { TransactionsDrawer } from '@components/TransactionsDrawer'
import { WidgetNetWorth } from './WidgetNetWorth'
import { WidgetCashflow } from './WidgetCashflow'
import { WidgetAccHistory } from './WidgetAccHistory'
import { nextPeriod, Period } from './shared/period'

export default function Stats() {
  const accs = accountModel.useAccountList()
  const [period, setPeriod] = useState<Period>(Period.LastYear)
  const togglePeriod = useCallback(() => setPeriod(nextPeriod), [])

  const [selected, setSelected] =
    useState<{ id: TAccountId; date: TISODate } | null>(null)

  const accIds = accs
    .sort((acc1, acc2) => {
      if (acc1.archive && acc2.archive) return 0
      if (acc1.archive) return 1
      if (acc2.archive) return -1
      return 0
    })
    .map(acc => acc.id)

  const onSelect = useCallback((id: TAccountId, date: TISODate) => {
    setSelected({ id, date })
  }, [])

  const filterConditions = {
    accounts: selected ? [selected.id] : null,
    dateFrom: selected ? selected.date : null,
    dateTo: selected ? selected.date : null,
  }

  return (
    <>
      <Box display="flex" flexDirection="column" pb={10}>
        <Rhythm gap={2} axis="y" p={3}>
          <WidgetNetWorth period={period} onTogglePeriod={togglePeriod} />
          <WidgetCashflow period={period} onTogglePeriod={togglePeriod} />
          {accIds.map(id => (
            <WidgetAccHistory
              key={id}
              id={id}
              period={period}
              onClick={onSelect}
            />
          ))}
        </Rhythm>
      </Box>

      <TransactionsDrawer
        filterConditions={filterConditions}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}

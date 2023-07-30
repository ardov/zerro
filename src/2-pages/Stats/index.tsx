import React, { useState, useCallback, useMemo } from 'react'
import { Button } from '@mui/material'
import { TAccountId, TISODate } from '6-shared/types'

import { accountModel } from '5-entities/account'
import { TransactionsDrawer } from '3-widgets/transaction/TransactionsDrawer'
import { WidgetNetWorth } from './WidgetNetWorth'
import { WidgetCashflow } from './WidgetCashflow'
import { WidgetAccHistory } from './WidgetAccHistory'
import { nextPeriod, Period } from './shared/period'
import { useToggle } from '6-shared/hooks/useToggle'
import { Stack } from '@mui/system'

export default function Stats() {
  const accs = accountModel.useAccountList()
  const [period, setPeriod] = useState<Period>(Period.LastYear)
  const [showArchived, toggleArchived] = useToggle(false)
  const togglePeriod = useCallback(() => setPeriod(nextPeriod), [])

  const [selected, setSelected] = useState<{
    id: TAccountId
    date: TISODate
  } | null>(null)

  const accIds = useMemo(
    () =>
      accs
        .filter(acc => showArchived || !acc.archive)
        .sort((acc1, acc2) => {
          if (acc1.archive && acc2.archive) return 0
          if (acc1.archive) return 1
          if (acc2.archive) return -1
          return 0
        })
        .map(acc => acc.id),
    [accs, showArchived]
  )

  const onSelect = useCallback((id: TAccountId, date: TISODate) => {
    setSelected({ id, date })
  }, [])

  const filterConditions = { account: selected?.id || null }

  return (
    <>
      <Stack spacing={2} p={3} pb={10}>
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
        <Button onClick={toggleArchived}>
          {showArchived ? 'Скрыть' : 'Показать'} архивные
        </Button>
      </Stack>

      <TransactionsDrawer
        filterConditions={filterConditions}
        initialDate={selected?.date}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}

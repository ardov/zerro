import type { TAccountId, TISODate } from '6-shared/types'

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@mui/material'
import { Stack } from '@mui/system'
import { useToggle } from '6-shared/hooks/useToggle'

import { accountModel } from '5-entities/account'
import { useTransactionDrawer } from '3-widgets/global/TransactionListDrawer'
import { WidgetNetWorth } from './WidgetNetWorth'
import { WidgetCashflow } from './WidgetCashflow'
import { WidgetAccHistory } from './WidgetAccHistory'
import { nextPeriod, Period } from './shared/period'

export default function Stats() {
  const { t } = useTranslation('accounts')
  const accs = accountModel.useAccountList()
  const [period, setPeriod] = useState<Period>(Period.LastYear)
  const [showArchived, toggleArchived] = useToggle(false)
  const togglePeriod = useCallback(() => setPeriod(nextPeriod), [])
  const trDrawer = useTransactionDrawer()

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
    trDrawer.open({ filterConditions: { account: id }, initialDate: date })
  }, [])

  return (
    <Stack spacing={2} p={3} pb={10}>
      <WidgetNetWorth period={period} onTogglePeriod={togglePeriod} />
      <WidgetCashflow period={period} onTogglePeriod={togglePeriod} />
      {accIds.map(id => (
        <WidgetAccHistory key={id} id={id} period={period} onClick={onSelect} />
      ))}
      <Button onClick={toggleArchived}>
        {t(showArchived ? 'hideArchived' : 'showArchived')}
      </Button>
    </Stack>
  )
}

import type { TAccountId, TISODate } from '6-shared/types'

import React, { useState, useCallback, memo } from 'react'
import { Stack } from '@mui/system'

import { useTransactionDrawer } from '3-widgets/global/TransactionListDrawer'
import { WidgetNetWorth } from './WidgetNetWorth'
import { WidgetCashflow } from './WidgetCashflow'
import { WidgetAccHistory } from './WidgetAccHistory'
import { nextPeriod, Period } from './shared/period'

export default function Stats() {
  const [period, setPeriod] = useState<Period>(Period.LastYear)
  const togglePeriod = useCallback(() => setPeriod(prevPeriod => nextPeriod(prevPeriod)), [])
  const trDrawer = useTransactionDrawer()

  const onSelect = useCallback((id: TAccountId, date: TISODate) => {
    trDrawer.open({ filterConditions: { account: id }, initialDate: date })
  }, [trDrawer])

  return (
    <Stack spacing={2} p={3} pb={10}>
      <WidgetNetWorth period={period} onTogglePeriod={togglePeriod} />
      <WidgetCashflow period={period} onTogglePeriod={togglePeriod} />
      <WidgetAccHistory period={period} onClick={onSelect} />
    </Stack>
  )
}

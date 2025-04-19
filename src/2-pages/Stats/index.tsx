import type { TAccountId, TISODate } from '6-shared/types'

import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack } from '@mui/system'

import { useTransactionDrawer } from '3-widgets/global/TransactionListDrawer'
import { WidgetNetWorth } from './WidgetNetWorth'
import { WidgetCashflow } from './WidgetCashflow'
import { WidgetAccHistory } from './WidgetAccHistory'
import { nextPeriod, Period } from './shared/period'

export default function Stats() {
  const { t } = useTranslation('accounts')
  const [period, setPeriod] = useState<Period>(Period.LastYear)
  const togglePeriod = useCallback(() => setPeriod(nextPeriod), [])
  const trDrawer = useTransactionDrawer()

  const onSelect = useCallback((id: TAccountId, date: TISODate) => {
    trDrawer.open({ filterConditions: { account: id }, initialDate: date })
  }, [])

  return (
    <Stack spacing={2} p={3} pb={10}>
      <WidgetNetWorth period={period} onTogglePeriod={togglePeriod} />
      <WidgetCashflow period={period} onTogglePeriod={togglePeriod} />
      <WidgetAccHistory period={period} onClick={onSelect} />
    </Stack>
  )
}

import React, { useState, useCallback } from 'react'
import { Stack } from '@mui/system'

import { WidgetNetWorth } from './WidgetNetWorth'
import { WidgetCashflow } from './WidgetCashflow'
import { WidgetAccHistory } from './WidgetAccHistory'
import { nextPeriod, Period } from './shared/period'

export default function Stats() {
  const [period, setPeriod] = useState<Period>(Period.LastYear)
  const togglePeriod = useCallback(
    () => setPeriod(prevPeriod => nextPeriod(prevPeriod)),
    []
  )

  return (
    <Stack spacing={2} p={3} pb={10}>
      <WidgetNetWorth period={period} onTogglePeriod={togglePeriod} />
      <WidgetCashflow period={period} onTogglePeriod={togglePeriod} />
      <WidgetAccHistory period={period} />
    </Stack>
  )
}

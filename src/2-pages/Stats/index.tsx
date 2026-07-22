import { useState, useCallback } from 'react'
import { Stack } from '@mui/system'
import { useTranslation } from 'react-i18next'

import { WidgetNetWorth } from './WidgetNetWorth'
import { WidgetCashflow } from './WidgetCashflow'
import { WidgetAccHistory } from './WidgetAccHistory'
import { nextPeriod, Period } from './shared/period'

export default function Stats() {
  const { t } = useTranslation('analytics')
  const [period, setPeriod] = useState<Period>(Period.LastYear)
  const togglePeriod = useCallback(
    () => setPeriod(prevPeriod => nextPeriod(prevPeriod)),
    []
  )

  return (
    <>
      <title>{`${t('pageTitle')} | Zerro`}</title>
      <Stack
        spacing={2}
        sx={{
          p: 3,
          pb: 10,
        }}
      >
        <WidgetNetWorth period={period} onTogglePeriod={togglePeriod} />
        <WidgetCashflow period={period} onTogglePeriod={togglePeriod} />
        <WidgetAccHistory period={period} />
      </Stack>
    </>
  )
}

import { useState, useCallback } from 'react'
import { Stack } from '@mui/system'
import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '6-shared/hooks/useDocumentTitle'

import { WidgetNetWorth } from './WidgetNetWorth'
import { WidgetCashflow } from './WidgetCashflow'
import { WidgetAccHistory } from './WidgetAccHistory'
import { nextPeriod, Period } from './shared/period'

export default function Stats() {
  const { t } = useTranslation('analytics')
  useDocumentTitle(`${t('pageTitle')} | Zerro`)
  const [period, setPeriod] = useState<Period>(Period.LastYear)
  const togglePeriod = useCallback(
    () => setPeriod(prevPeriod => nextPeriod(prevPeriod)),
    []
  )

  return (
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
  )
}

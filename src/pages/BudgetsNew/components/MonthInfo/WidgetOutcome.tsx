import React from 'react'
import { Box } from '@mui/material'
import { Total } from '../components'
import { useMonth } from 'pages/Budgets/pathHooks'
import { useMonthTotals } from 'models/envelopeData'
import { convertFx } from 'shared/helpers/money'

export function WidgetOutcome() {
  const [month] = useMonth()
  const { activity, currency, rates } = useMonthTotals(month)
  const envActivity = convertFx(activity, currency, rates)

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.default',
        borderRadius: 1,
        display: 'flex',
        justifyContent: 'center',
      }}
      onClick={() => console.log(activity)}
    >
      <Total name="Расход" value={envActivity} currency={currency} sign />
    </Box>
  )
}

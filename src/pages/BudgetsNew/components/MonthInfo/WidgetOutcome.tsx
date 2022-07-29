import React from 'react'
import { useAppSelector } from 'store'
import { Box } from '@mui/material'
import { Total } from '../components'
import { useMonth } from 'pages/Budgets/pathHooks'
import { getMonthTotals } from 'models/envelopes'
import { convertFx } from 'shared/helpers/currencyHelpers'

export function WidgetOutcome() {
  const [month] = useMonth()
  const data = useAppSelector(getMonthTotals)?.[month]
  const { activity, currency, rates } = data
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

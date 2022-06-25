import React from 'react'
import { useAppSelector } from 'models'
import { getTotalsByMonth } from '../../selectors'
import { getUserCurrencyCode } from 'models/data/instruments'
import { Box } from '@mui/material'
import { Total } from '../components'
import { useMonth } from 'pages/Budgets/pathHooks'

export function WidgetOutcome() {
  const [month] = useMonth()
  const outcome = useAppSelector(getTotalsByMonth)?.[month]?.outcome
  const currency = useAppSelector(getUserCurrencyCode)

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.default',
        borderRadius: 1,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Total name="Расход" value={-outcome} currency={currency} sign />
    </Box>
  )
}
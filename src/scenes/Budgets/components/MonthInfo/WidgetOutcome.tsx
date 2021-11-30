import React from 'react'
import { useSelector } from 'react-redux'
import { getTotalsByMonth } from '../../selectors'
import { getUserCurrencyCode } from 'store/data/instruments'
import { Box } from '@mui/material'
import { Total } from '../components'
import { useMonth } from 'scenes/Budgets/pathHooks'

export function WidgetOutcome() {
  const [month] = useMonth()
  const outcome = useSelector(getTotalsByMonth)?.[month]?.outcome
  const currency = useSelector(getUserCurrencyCode)

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

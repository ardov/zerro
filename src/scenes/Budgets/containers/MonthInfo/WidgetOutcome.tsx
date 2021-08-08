import React from 'react'
import { useSelector } from 'react-redux'
import { getTotalsByMonth } from '../../selectors/getTotalsByMonth'
import { getUserCurrencyCode } from 'store/data/selectors'
import { Box } from '@material-ui/core'
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

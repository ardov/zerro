import React, { useContext } from 'react'
import { useSelector } from 'react-redux'
import { MonthContext } from 'scenes/Budgets'
import { getTotalsByMonth } from '../../selectors/getTotalsByMonth'
import { getUserCurrencyCode } from 'store/serverData'
import { Box } from '@material-ui/core'
import { Total } from '../components'

export function WidgetOutcome() {
  const month = useContext(MonthContext)
  const outcome = useSelector(getTotalsByMonth)?.[month]?.outcome
  const currency = useSelector(getUserCurrencyCode)

  return (
    <Box
      p={2}
      bgcolor="background.default"
      borderRadius={8}
      display="flex"
      justifyContent="center"
    >
      <Total name="Расход" value={-outcome} currency={currency} sign />
    </Box>
  )
}

import React from 'react'
import { useSelector } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { getTotalsByMonth } from '../selectors/getTotalsByMonth'
import { getUserCurrencyCode } from 'store/serverData'
import { Paper, Box, Typography } from '@material-ui/core'

export default function ToBeBudgeted({ index, ...rest }) {
  const currency = useSelector(getUserCurrencyCode)
  const toBeBudgeted = useSelector(
    state => getTotalsByMonth(state)?.[index]?.toBeBudgeted
  )

  const formatSum = sum => formatMoney(sum, currency)
  const color = toBeBudgeted < 0 ? 'error' : 'textPrimary'

  return (
    <Paper {...rest}>
      <Box py={1.5}>
        <Typography noWrap align="center" variant="h5" color={color}>
          {toBeBudgeted ? formatSum(toBeBudgeted) : '👍'}
        </Typography>
        <Typography noWrap align="center" variant="body2" color="textSecondary">
          {toBeBudgeted ? 'Осталось распределить' : 'Деньги распределены'}
        </Typography>
      </Box>
    </Paper>
  )
}

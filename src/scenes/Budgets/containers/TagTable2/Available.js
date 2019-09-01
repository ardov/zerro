import React from 'react'
import Typography from '@material-ui/core/Typography'
import { formatMoney } from 'helpers/format'

export function Available({ value }) {
  return (
    <Typography
      variant="body1"
      align="right"
      color={value < 0 ? 'error' : 'inherit'}
    >
      {formatMoney(value)}
    </Typography>
  )
}

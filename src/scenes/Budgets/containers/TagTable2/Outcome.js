import React from 'react'
import Typography from '@material-ui/core/Typography'
import { formatMoney } from 'helpers/format'

export function Outcome({ value }) {
  return (
    <Typography variant="body1" align="right" color="inherit">
      {formatMoney(-value)}
    </Typography>
  )
}

import React from 'react'
import { Typography } from '@mui/material'
import Rhythm from '@shared/ui/Rhythm'
import pluralize from '@shared/helpers/pluralize'
import { Card, TCardProps } from '../shared/Card'
import { useStats } from '../shared/getFacts'

export function QRCard(props: TCardProps) {
  const yearStats = useStats(props.year)
  const hasReceipt = yearStats.total.outcomeTransactions.filter(tr => tr.qrCode)
  const value = hasReceipt.length

  if (!value) return null
  return (
    <Card>
      <Rhythm gap={1}>
        <Typography variant="body1" align="center">
          Вы прикрепили
        </Typography>
        <Typography variant="h4" align="center">
          {value} {pluralize(value, ['чек', 'чека', 'чеков'])}
        </Typography>
      </Rhythm>
    </Card>
  )
}

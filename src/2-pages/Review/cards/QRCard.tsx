import React from 'react'
import { ButtonBase, Stack, Typography } from '@mui/material'
import pluralize from '6-shared/helpers/pluralize'
import { Card, TCardProps } from '../shared/Card'
import { useStats } from '../shared/getFacts'

export function QRCard(props: TCardProps) {
  const yearStats = useStats(props.year)
  const hasReceipt = yearStats.total.outcomeTransactions.filter(tr => tr.qrCode)
  const value = hasReceipt.length

  if (!value) return null
  // TODO: i18n
  return (
    <Card>
      <ButtonBase
        sx={{ borderRadius: 1, px: 1 }}
        onClick={() => props.onShowTransactions(hasReceipt)}
      >
        <Stack gap={1}>
          <Typography variant="body1" align="center">
            Вы прикрепили
          </Typography>
          <Typography variant="h4" align="center">
            {value} {pluralize(value, ['чек', 'чека', 'чеков'])}
          </Typography>
        </Stack>
      </ButtonBase>
    </Card>
  )
}

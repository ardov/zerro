import React from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonBase, Stack, Typography } from '@mui/material'
import { Card, TCardProps } from '../shared/Card'
import { useStats } from '../shared/getFacts'

export function QRCard(props: TCardProps) {
  const { t } = useTranslation('yearReviewQR')
  const yearStats = useStats(props.year)
  const hasReceipt = yearStats.total.outcomeTransactions.filter(tr => tr.qrCode)
  const value = hasReceipt.length

  if (!value) return null
  return (
    <Card>
      <ButtonBase
        sx={{ borderRadius: 1, px: 1 }}
        onClick={() => props.onShowTransactions(hasReceipt)}
      >
        <Stack gap={1}>
          <Typography variant="body1" align="center">
            {t('youAttached')}
          </Typography>
          <Typography variant="h4" align="center">
            {t('receipt', { count: value })}
          </Typography>
        </Stack>
      </ButtonBase>
    </Card>
  )
}

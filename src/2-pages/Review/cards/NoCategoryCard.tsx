import React from 'react'
import { ButtonBase, Stack, Typography } from '@mui/material'
import { Card, TCardProps } from '../shared/Card'
import { useStats } from '../shared/getFacts'
import { useTranslation } from 'react-i18next'

export function NoCategoryCard(props: TCardProps) {
  const yearStats = useStats(props.year)
  const { t } = useTranslation('yearReview', { keyPrefix: 'noCategory' })
  const noTag = [
    ...yearStats.total.incomeTransactions.filter(tr => !tr.tag),
    ...yearStats.total.outcomeTransactions.filter(tr => !tr.tag),
  ]
  const count = noTag.length
  return (
    <Card>
      <Stack spacing={1}>
        {count ? (
          <>
            <ButtonBase
              sx={{ borderRadius: 1, px: 1 }}
              onClick={() => props.onShowTransactions(noTag)}
            >
              <Typography variant="h4" align="center">
                {t('title', { count })}
              </Typography>
            </ButtonBase>
            <Typography variant="body1" align="center">
              {t('withoutCategory', { count })}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h4" align="center">
              👍
            </Typography>
            <Typography variant="body1" align="center">
              {t('allTransactionsHaveCategories')}
            </Typography>
          </>
        )}
      </Stack>
    </Card>
  )
}

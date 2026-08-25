import { ButtonBase, Typography } from '@mui/material'
import type { TCardProps } from '../shared/Card'
import { Card } from '../shared/Card'
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
      <div className="flex flex-col gap-2">
        {count ? (
          <>
            <ButtonBase
              className="rounded-lg px-2"
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
      </div>
    </Card>
  )
}

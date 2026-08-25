import { useTranslation } from 'react-i18next'
import { ButtonBase, Typography } from '@mui/material'
import type { TCardProps } from '../shared/Card'
import { Card } from '../shared/Card'
import { useStats } from '../shared/getFacts'

export function QRCard(props: TCardProps) {
  const { t } = useTranslation('yearReview', { keyPrefix: 'qrCard' })
  const yearStats = useStats(props.year)
  const hasReceipt = yearStats.total.outcomeTransactions.filter(tr => tr.qrCode)
  const value = hasReceipt.length

  if (!value) return null
  return (
    <Card>
      <ButtonBase
        className="rounded-lg px-2"
        onClick={() => props.onShowTransactions(hasReceipt)}
      >
        <div className="flex flex-col gap-2">
          <Typography variant="body1" align="center">
            {t('youAttached')}
          </Typography>
          <Typography variant="h4" align="center">
            {t('receipt', { count: value })}
          </Typography>
        </div>
      </ButtonBase>
    </Card>
  )
}

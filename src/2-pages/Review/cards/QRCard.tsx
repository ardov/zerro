import { useTranslation } from 'react-i18next'
import { ButtonBase } from '@mui/material'
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
          <p className="m-0 text-center text-base leading-6">
            {t('youAttached')}
          </p>
          <h2 className="m-0 text-center text-[2.125rem] leading-[1.235] font-medium">
            {t('receipt', { count: value })}
          </h2>
        </div>
      </ButtonBase>
    </Card>
  )
}

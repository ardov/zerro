import { ButtonBase } from '6-shared/ui/Button'
import { useTranslation } from 'react-i18next'
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
          <p className="m-0 text-center type-body font-sans">
            {t('youAttached')}
          </p>
          <h2 className="m-0 text-center type-display font-sans">
            {t('receipt', { count: value })}
          </h2>
        </div>
      </ButtonBase>
    </Card>
  )
}

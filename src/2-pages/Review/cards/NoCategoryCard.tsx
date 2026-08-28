import { ButtonBase } from '6-shared/ui/Button'
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
              <h2 className="m-0 text-center type-display font-sans">
                {t('title', { count })}
              </h2>
            </ButtonBase>
            <p className="m-0 text-center type-body">
              {t('withoutCategory', { count })}
            </p>
          </>
        ) : (
          <>
            <p className="m-0 text-center type-display">👍</p>
            <p className="m-0 text-center type-body">
              {t('allTransactionsHaveCategories')}
            </p>
          </>
        )}
      </div>
    </Card>
  )
}

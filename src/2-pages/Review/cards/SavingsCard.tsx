import { core } from '@/zerro-core/redux'

import { useTranslation } from 'react-i18next'

import { DisplayAmount } from '@/3-widgets/DisplayAmount'
import type { TCardProps } from '../shared/Card'
import { Card } from '../shared/Card'
import { useStats } from '../shared/getFacts'

export function SavingsCard({ year }: TCardProps) {
  const { t } = useTranslation('yearReview', { keyPrefix: 'savingsCard' })
  const yearStats = useStats(year)
  const toDisplay = core.currency.useToDisplay('current')

  const income = toDisplay(yearStats.total.income)
  const outcome = toDisplay(yearStats.total.outcome)

  if (income === 0) return null // no income, no savings

  const savings = income - outcome
  if (savings <= 0) return null // talk only about savings, not overspending

  const savingsPercent = Math.round((Math.abs(savings) / income) * 100)
  const monthlyOutcome = outcome / 12
  const monthsOfSavings =
    monthlyOutcome > 0 && savings ? Math.floor(savings / monthlyOutcome) : 0

  return (
    <Card>
      <div className="flex flex-col items-center gap-2">
        <p className="m-0 text-center text-body">{t('youSaved')}</p>
        <h2
          className={`m-0 text-center text-display ${savings ? 'green-gradient' : 'red-gradient'}`}
        >
          <DisplayAmount value={savings} noShade decimals="ifOnly" />
        </h2>

        <div>
          <p className="m-0 text-center text-body">
            {t('savingsPercent', { percent: savingsPercent }) +
              ' ' +
              (savingsPercent > 20 ? t('greatJob') : t('goodJob'))}
          </p>

          {monthsOfSavings > 0 && (
            <p className="m-0 mt-2 text-center text-body">
              {t('savingsMonths', { months: monthsOfSavings })}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

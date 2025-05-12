import { Box, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import {
  DisplayAmount,
  displayCurrency,
} from '5-entities/currency/displayCurrency'
import { Card, TCardProps } from '../shared/Card'
import { useStats } from '../shared/getFacts'

export function SavingsCard({ year }: TCardProps) {
  const { t } = useTranslation('yearReview', { keyPrefix: 'savingsCard' })
  const yearStats = useStats(year)
  const toDisplay = displayCurrency.useToDisplay('current')

  const income = toDisplay(yearStats.total.income)
  const outcome = toDisplay(yearStats.total.outcome)

  if (income === 0) return null // no income, no savings

  let savings = income - outcome
  if (savings < 0) savings = 0 // talk only about savings, not overspending

  const savingsPercent = Math.round((Math.abs(savings) / income) * 100)
  const monthlyOutcome = outcome / 12
  const monthsOfSavings =
    monthlyOutcome > 0 && savings ? Math.floor(savings / monthlyOutcome) : 0

  return (
    <Card>
      <Stack spacing={1} alignItems="center">
        <Typography variant="body1" align="center">
          {t('youSaved')}
        </Typography>
        <Typography
          variant="h4"
          align="center"
          className={savings ? 'green-gradient' : 'red-gradient'}
        >
          <DisplayAmount value={savings} noShade decMode="ifOnly" />
        </Typography>

        <Box mt={2}>
          <Typography variant="body1" align="center">
            {t('savingsPercent', { percent: savingsPercent }) +
              ' ' +
              (savingsPercent > 20 ? t('greatJob') : t('goodJob'))}
          </Typography>

          {monthsOfSavings > 0 && (
            <Typography variant="body1" align="center" mt={1}>
              {t('savingsMonths', { months: monthsOfSavings })}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  )
}

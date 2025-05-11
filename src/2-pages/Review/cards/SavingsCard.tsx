import { Box, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { DisplayAmount, displayCurrency } from '5-entities/currency/displayCurrency'
import { Card, TCardProps } from "../shared/Card"
import { useStats } from "../shared/getFacts"

import { subFxAmount } from "6-shared/helpers/money"

export function SavingsCard({year}: TCardProps) {
  const { t } = useTranslation('yearReview', { keyPrefix: 'savingsCard' })
  const yearStats = useStats(year)
  const toDisplay = displayCurrency.useToDisplay('current')

  const income = yearStats.total.income
  const outcome = yearStats.total.outcome
  const savings = subFxAmount(income, outcome)

  const savingsAmount = toDisplay(savings)
  const incomeAmount = toDisplay(income)
  const hasSavings = savingsAmount > 0

  const savingsPercent = Math.round((Math.abs(savingsAmount) / incomeAmount) * 100)
  const monthlyOutcome = toDisplay(outcome) / 12
  const monthsOfSavings = (monthlyOutcome > 0 && hasSavings)
    ? Math.floor(savingsAmount / monthlyOutcome)
    : 0

  return (
    <Card>
      <Stack spacing={1} alignItems="center">
        <Typography variant="body1" align="center">
          {hasSavings ? t('youSaved') : t('youOverspent')}
        </Typography>
        <Typography
          variant="h4"
          align="center"
          className={hasSavings ? "green-gradient" : "red-gradient"}
        >
          <DisplayAmount value={hasSavings ? savingsAmount : -savingsAmount} noShade decMode="ifOnly" />
        </Typography>

        <Box mt={2}>
          <Typography variant="body2" align="center">
            {savingsPercent > 0
              ? (t('savingsPercent', { percent: savingsPercent }) + " "
                + (savingsPercent > 20 ? t("greatJob") : t("goodJob")))
              : t('overspendPercent', { percent: -savingsPercent })
            }
          </Typography>

          {monthsOfSavings > 0 && (
            <Typography variant="body2" align="center" mt={1}>
              {t('savingsMonths', { months: monthsOfSavings })}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  )
}

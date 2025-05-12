import React, { FC } from 'react'
import {
  Typography,
  ButtonBase,
  Divider,
  ButtonBaseProps,
  Stack,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '6-shared/ui/theme'
import { sub } from '6-shared/helpers/money'
import { Tooltip } from '6-shared/ui/Tooltip'
import { Amount } from '6-shared/ui/Amount'
import { DataLine } from '3-widgets/DataLine'
import { ArrowForwardIcon } from '6-shared/ui/Icons'

import { displayCurrency } from '5-entities/currency/displayCurrency'
import { balances } from '5-entities/envBalances'
import { useMonth } from '../../MonthProvider'
import { useIsSmall } from '../shared/shared'

type TMsgType = 'error' | 'warning' | 'success'

type ToBeBudgetedProps = ButtonBaseProps

export const ToBeBudgeted: FC<ToBeBudgetedProps> = props => {
  const { t } = useTranslation('budgets')
  const {
    currency,
    toBeBudgeted,
    hasFutureOverspend,
    msgType,
    TooltipContent,
  } = useTotalsModel()

  const theme = useAppTheme()
  const isSmall = useIsSmall()

  const bg = theme.palette[msgType].main
  const color = theme.palette.getContrastText(bg)

  return (
    <Tooltip arrow title={<TooltipContent />}>
      <ButtonBase
        sx={{
          display: 'flex',
          gap: 1,
          borderRadius: 1,
          py: 1,
          pl: 2,
          pr: 1,
          background: bg,
          color: color,
        }}
        {...props}
      >
        <Typography noWrap align="center" variant="body1">
          {!isSmall &&
            (toBeBudgeted ? t('notAllocated') : t('allAllocated')) + ' '}
          {toBeBudgeted ? (
            <Amount
              value={toBeBudgeted}
              currency={currency}
              decMode="ifOnly"
              noShade
            />
          ) : hasFutureOverspend ? (
            '👍'
          ) : (
            '👌'
          )}
        </Typography>
        <ArrowForwardIcon fontSize="small" />
      </ButtonBase>
    </Tooltip>
  )
}

function useTotalsModel() {
  const { t } = useTranslation('budgets')
  const [month] = useMonth()

  const [currency] = displayCurrency.useDisplayCurrency()
  const toDisplay = displayCurrency.useToDisplay(month)

  const monthList = balances.useMonthList()
  const lastMonth = monthList[monthList.length - 1]

  const totals = balances.useTotals()[month]
  const lastTotals = balances.useTotals()[lastMonth]

  const toBeBudgeted = toDisplay(totals.toBeBudgeted)
  const overspend = toDisplay(totals.overspend)
  const hasFutureOverspend = toDisplay(lastTotals.overspend)
  const fundsEnd = toDisplay(totals.fundsEnd)
  const allocated = toDisplay(totals.available)
  const budgetedInFuture = toDisplay(totals.budgetedInFuture)

  const freeWithoutFuture = sub(fundsEnd, allocated)
  const displayBudgetedInFuture =
    freeWithoutFuture < 0
      ? 0
      : budgetedInFuture >= freeWithoutFuture
        ? freeWithoutFuture
        : budgetedInFuture

  const msgType: TMsgType =
    toBeBudgeted < 0 ? 'error' : !!overspend ? 'warning' : 'success'

  const messages = {
    success: toBeBudgeted
      ? t('explainer.hasFreeMoney')
      : t('explainer.zeroToBeBudgeted'),
    warning: t('explainer.overspend'),
    error: t('explainer.budgetedMoreThanHave'),
  }

  function TooltipContent() {
    return (
      <Stack spacing={1}>
        <Typography variant="body2" align="center">
          {messages[msgType]}
        </Typography>
        <Divider />

        <DataLine name={t('inBalance')} amount={fundsEnd} currency={currency} />
        <Divider />

        <DataLine
          name={t('inEnvelopes')}
          amount={allocated}
          currency={currency}
        />
        <DataLine
          name={t('budgetedInFuture')}
          amount={displayBudgetedInFuture}
          currency={currency}
        />
        <DataLine
          name={t('toBeBudgeted')}
          amount={toBeBudgeted}
          currency={currency}
        />
      </Stack>
    )
  }

  return {
    currency,
    toBeBudgeted,
    overspend,
    hasFutureOverspend,
    month,
    msgType,
    TooltipContent,
  }
}

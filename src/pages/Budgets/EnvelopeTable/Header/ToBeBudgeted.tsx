import React, { FC } from 'react'
import { Typography, ButtonBase, Divider, ButtonBaseProps } from '@mui/material'
import { useTheme } from '@mui/styles'
import { formatMoney, sub } from '@shared/helpers/money'
import { useMonth } from '@shared/hooks/useMonth'
import { Tooltip } from '@shared/ui/Tooltip'
import { Amount } from '@shared/ui/Amount'
import Rhythm from '@shared/ui/Rhythm'
import { DataLine } from '@components/DataLine'
import { ArrowForwardIcon } from '@shared/ui/Icons'

import { displayCurrency } from '@entities/currency/displayCurrency'
import { balances } from '@entities/envBalances'
import { useIsSmall } from '../shared/shared'

type TMsgType = 'error' | 'warning' | 'success'

type ToBeBudgetedProps = ButtonBaseProps
export const ToBeBudgeted: FC<ToBeBudgetedProps> = props => {
  const {
    currency,
    toBeBudgeted,
    hasFutureOverspend,
    msgType,
    TooltipContent,
  } = useTotalsModel()

  const theme = useTheme()
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
            (toBeBudgeted ? 'Не распределено ' : 'Деньги распределены ')}
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

  const formatSum = (sum: number) => formatMoney(sum, currency)

  const messages = {
    success: toBeBudgeted
      ? `Распределите деньги по категориям в этом или следующем месяце.`
      : `Все деньги распределены по категориям, так держать 🥳`,
    warning: `Перерасход в категориях на ${formatSum(
      -overspend
    )}. Добавьте денег в категории с перерасходом.`,
    error: `Вы распределили больше денег, чем у вас есть. Из каких-то категорий придётся забрать деньги.`,
  }

  function TooltipContent() {
    return (
      <Rhythm gap={1}>
        <Typography variant="body2" align="center">
          {messages[msgType]}
        </Typography>
        <Divider />

        <DataLine
          name="Всего в балансе"
          amount={fundsEnd}
          currency={currency}
        />
        <Divider />

        <DataLine
          name={`Лежит в категориях`}
          amount={allocated}
          currency={currency}
        />
        <DataLine
          name={`Распределено в будущем`}
          amount={displayBudgetedInFuture}
          currency={currency}
        />
        <DataLine name={`Свободно`} amount={toBeBudgeted} currency={currency} />
      </Rhythm>
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

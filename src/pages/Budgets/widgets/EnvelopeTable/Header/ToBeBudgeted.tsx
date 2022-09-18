import React, { FC } from 'react'
import {
  Typography,
  ButtonBase,
  Divider,
  useMediaQuery,
  ButtonBaseProps,
  Theme,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { formatMoney, sub } from '@shared/helpers/money'
import { useMonth } from '@shared/hooks/useMonth'
import { Tooltip } from '@shared/ui/Tooltip'
import { Amount } from '@shared/ui/Amount'
import Rhythm from '@shared/ui/Rhythm'
import {
  useDisplayValue,
  useMonthList,
  useMonthTotals,
} from '@entities/envelopeData'
import { useDisplayCurrency } from '@entities/instrument/hooks'
import { DataLine } from '@shared/ui/DataLine'

type TMsgType = 'error' | 'warning' | 'success'

const useStyles = makeStyles<Theme, { color: TMsgType }>(({ palette }) => ({
  base: {
    background: ({ color }) =>
      `linear-gradient(105deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 100%
        ),${palette[color].main}`,
    color: ({ color }) => palette.getContrastText(palette[color].main),
  },
  label: { minWidth: 0 },
}))

type ToBeBudgetedProps = ButtonBaseProps
export const ToBeBudgeted: FC<ToBeBudgetedProps> = props => {
  const { className, ...rest } = props
  const {
    currency,
    toBeBudgeted,
    hasFutureOverspend,
    msgType,
    TooltipContent,
  } = useTotalsModel()

  const c = useStyles({ color: msgType })
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  return (
    <Tooltip arrow title={<TooltipContent />}>
      <ButtonBase
        sx={{
          borderRadius: 1,
          py: 1,
          px: 2,
        }}
        className={`${c.base} ${className}`}
        {...rest}
      >
        <Typography noWrap align="center" variant="body1" className={c.label}>
          {!isMobile &&
            (toBeBudgeted ? 'Не распределено ' : 'Деньги распределены ')}
          {toBeBudgeted ? (
            <Amount
              value={toBeBudgeted}
              currency={currency}
              decMode="ifAny"
              noShade
            />
          ) : hasFutureOverspend ? (
            '👍'
          ) : (
            '👌'
          )}
        </Typography>
      </ButtonBase>
    </Tooltip>
  )
}

function useTotalsModel() {
  const [month] = useMonth()

  const currency = useDisplayCurrency()
  const toDisplay = useDisplayValue(month)

  const monthList = useMonthList()
  const lastMonth = monthList[monthList.length - 1]

  const totals = useMonthTotals(month)
  const lastTotals = useMonthTotals(lastMonth)

  const toBeBudgeted = toDisplay(totals.toBeBudgetedFx)
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
          name="Всего в бюджете"
          amount={fundsEnd}
          currency={currency}
        />
        <Divider />

        <DataLine
          name={`Лежит в конвертах`}
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

import React, { FC } from 'react'
import {
  Typography,
  ButtonBase,
  Box,
  Divider,
  useMediaQuery,
  ButtonBaseProps,
  Theme,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { formatMoney, sub } from '@shared/helpers/money'
import { Tooltip } from '@shared/ui/Tooltip'
import { Amount } from '@shared/ui/Amount'
import Rhythm from '@shared/ui/Rhythm'
import {
  useDisplayValue,
  useMonthList,
  useMonthTotals,
} from '@entities/envelopeData'
import { useMonth } from '../../../model'
import { useDisplayCurrency } from '@entities/instrument/hooks'

type TMsgType = 'error' | 'warning' | 'success'

const useStyles = makeStyles<Theme, { color: TMsgType }>(
  ({ shape, spacing, palette, breakpoints }) => ({
    base: {
      // display: 'flex',
      // flexDirection: 'column',
      // borderRadius: shape.borderRadius,
      // padding: spacing(1.5, 2),
      background: ({ color }) =>
        `linear-gradient(105deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 100%
        ),${palette[color].main}`,
      // boxShadow: ({ color }) => `0 8px 20px -12px ${palette[color].main}`,
      // transition: '0.4s',
      color: ({ color }) => palette.getContrastText(palette[color].main),

      // [breakpoints.down('xs')]: {
      //   flexDirection: 'row-reverse',
      //   justifyContent: 'space-between',
      // },
    },
    small: { padding: spacing(1, 2) },
    label: { minWidth: 0 },
  })
)

type ToBeBudgetedProps = ButtonBaseProps & {
  small?: boolean
}
export const ToBeBudgeted: FC<ToBeBudgetedProps> = props => {
  const { small, className, ...rest } = props
  const {
    currency,
    toBeBudgeted,
    hasFutureOverspend,
    msgType,
    TooltipContent,
  } = useTotalsModel()

  const c = useStyles({ color: msgType })
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  const BigWidget = (
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
  )

  const SmallWidget = (
    <ButtonBase className={`${c.base} ${c.small} ${className}`} {...rest}>
      <Typography noWrap align="center" variant="body1">
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
  )

  return (
    <Tooltip arrow title={<TooltipContent />}>
      {/* {small ? SmallWidget : BigWidget} */}
      {BigWidget}
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

        <Line name="Всего в бюджете" amount={formatSum(fundsEnd)} />
        <Divider />

        <Line name={`Лежит в конвертах`} amount={formatSum(allocated)} />
        <Line
          name={`Распределено в будущем`}
          amount={formatSum(displayBudgetedInFuture)}
        />
        <Line name={`Свободно`} amount={formatSum(toBeBudgeted)} />
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

const Line: FC<{ name: string; amount: string }> = props => {
  const { name, amount } = props
  return (
    <Box display="flex" flexDirection="row">
      <Typography
        noWrap
        variant="caption"
        sx={{ flexGrow: 1, mr: 1, minWidth: 0 }}
      >
        {name}
      </Typography>

      <Typography variant="caption">{amount}</Typography>
    </Box>
  )
}

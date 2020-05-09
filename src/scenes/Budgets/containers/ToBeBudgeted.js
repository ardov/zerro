import React from 'react'
import { useSelector } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { getTotalsByMonth } from '../selectors/getTotalsByMonth'
import { getUserCurrencyCode } from 'store/serverData'
import { Typography, ButtonBase, makeStyles, Tooltip } from '@material-ui/core'

const useStyles = makeStyles(({ shape, spacing, palette }) => ({
  base: {
    display: 'block',
    width: '100%',
    borderRadius: shape.borderRadius,
    padding: spacing(1.5, 1),
    background: ({ color }) =>
      `linear-gradient(105deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 100%
        ),${palette[color].main}`,
    boxShadow: ({ color }) => `0 8px 20px -12px ${palette[color].main}`,
    transition: '0.4s',
    color: ({ color }) => palette.getContrastText(palette[color].main),
  },
}))

export default function ToBeBudgeted({ index, ...rest }) {
  const currency = useSelector(getUserCurrencyCode)
  const totals = useSelector(state => getTotalsByMonth(state)?.[index])
  const toBeBudgeted = totals?.toBeBudgeted || 0
  const overspent = totals?.overspent || 0
  const color = toBeBudgeted < 0 ? 'error' : overspent ? 'warning' : 'success'

  const c = useStyles({ color })

  const formatSum = sum => formatMoney(sum, currency)

  const messages = {
    success: 'Все деньги распределены по категориям, так держать 🥳',
    warning: `Перерасход в категориях ${formatSum(
      overspent
    )}. Добавьте денег в категории с перерасходом.`,
    error: `Вы распределили больше денег, чем у вас есть. Из каких-то категорий придётся забрать деньги.`,
  }

  return (
    <Tooltip arrow title={messages[color]}>
      <ButtonBase className={c.base} {...rest}>
        <Typography noWrap align="center" variant="h5">
          {toBeBudgeted ? formatSum(toBeBudgeted) : '👍'}
        </Typography>
        <Typography noWrap align="center" variant="body2">
          {toBeBudgeted ? 'Осталось распределить' : 'Деньги распределены'}
        </Typography>
      </ButtonBase>
    </Tooltip>
  )
}

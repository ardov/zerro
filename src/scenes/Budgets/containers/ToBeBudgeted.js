import React from 'react'
import { useSelector } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { getTotalsByMonth } from '../selectors/getTotalsByMonth'
import { getUserCurrencyCode } from 'store/serverData'
import {
  Typography,
  ButtonBase,
  Box,
  makeStyles,
  Divider,
  useMediaQuery,
} from '@material-ui/core'
import { Tooltip } from 'components/Tooltip'
import Rhythm from 'components/Rhythm'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { useMonth } from '../useMonth'
import { Amount } from './components'

const useStyles = makeStyles(({ shape, spacing, palette, breakpoints }) => ({
  base: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: shape.borderRadius,
    padding: spacing(1.5, 2),
    background: ({ color }) =>
      `linear-gradient(105deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 100%
        ),${palette[color].main}`,
    boxShadow: ({ color }) => `0 8px 20px -12px ${palette[color].main}`,
    transition: '0.4s',
    color: ({ color }) => palette.getContrastText(palette[color].main),

    [breakpoints.down('xs')]: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
    },
  },
  small: { padding: spacing(1, 2) },
  label: { minWidth: 0 },
}))

const getMonthName = date => format(date, 'LLL', { locale: ru }).toLowerCase()

export function ToBeBudgeted({ index, className, small, ...rest }) {
  const [month] = useMonth()
  const currency = useSelector(getUserCurrencyCode)
  const totals = useSelector(getTotalsByMonth)[month]
  const {
    toBeBudgeted,
    overspent,
    realBudgetedInFuture,
    budgetedInFuture,
  } = totals
  const color = toBeBudgeted < 0 ? 'error' : overspent ? 'warning' : 'success'
  const hasFutureOverspend = realBudgetedInFuture > budgetedInFuture
  const c = useStyles({ color })
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('xs'))

  const BigWidget = (
    <ButtonBase className={`${c.base} ${className}`} {...rest}>
      <Typography noWrap align="center" variant={isMobile ? 'body1' : 'h5'}>
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
      <Typography
        noWrap
        align="center"
        variant={isMobile ? 'body1' : 'body2'}
        className={c.label}
      >
        {toBeBudgeted ? 'Не распределено' : 'Деньги распределены'}
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
            decimals="ifAny"
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
    <TotalsTooltip color={color} {...{ currency, totals, index }}>
      {small ? SmallWidget : BigWidget}
    </TotalsTooltip>
  )
}

function TotalsTooltip({ currency, color, totals, index, children }) {
  const {
    date,
    prevOverspent,
    toBeBudgeted,
    overspent,
    income,
    prevFunds,
    transferOutcome,
    transferFees,
    // realBudgetedInFuture,
    budgeted,
    budgetedInFuture,
  } = totals
  const formatSum = sum => formatMoney(sum, currency)

  const messages = {
    success: toBeBudgeted
      ? `Распределите деньги по категориям в этом или следующем месяце.`
      : `Все деньги распределены по\u00A0категориям, так держать 🥳`,
    warning: `Перерасход в категориях ${formatSum(
      overspent
    )}. Добавьте денег в категории с перерасходом.`,
    error: `Вы распределили больше денег, чем у вас есть. Из каких-то категорий придётся забрать деньги.`,
  }

  function Line({ name, amount }) {
    return (
      <Box display="flex" flexDirection="row">
        <Box flexGrow="1" mr={1} minWidth={0}>
          <Typography noWrap variant="caption">
            {name}
          </Typography>
        </Box>

        <Typography variant="caption">
          {amount > 0 && '+'}
          {formatSum(amount)}
        </Typography>
      </Box>
    )
  }

  function TooltipContent() {
    return (
      <Rhythm gap={1}>
        <Typography variant="body2" align="center">
          {messages[color]}
        </Typography>
        <Divider />
        {index ? (
          <>
            <Line name="Остаток с прошлого месяца" amount={prevFunds} />
            <Line name="Перерасход в прошлом месяце" amount={-prevOverspent} />
          </>
        ) : (
          <Line name="Начальный остаток на счетах" amount={prevFunds} />
        )}
        <Line name={`Доход за ${getMonthName(date)}`} amount={income} />
        <Line name={`Бюджеты на ${getMonthName(date)}`} amount={-budgeted} />
        <Line
          name="Переводы без категории"
          amount={-transferOutcome - transferFees}
        />
        <Line name="Распределено в будущем" amount={-budgetedInFuture} />
      </Rhythm>
    )
  }

  return (
    <Tooltip arrow interactive title={<TooltipContent />}>
      {children}
    </Tooltip>
  )
}

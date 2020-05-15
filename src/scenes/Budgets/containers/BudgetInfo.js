import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { getTotalsByMonth } from '../selectors/getTotalsByMonth'
import { getUserCurrencyCode } from 'store/serverData'
import { Droppable } from 'react-beautiful-dnd'
import Confirm from 'components/Confirm'
import {
  copyPreviousBudget,
  fillGoals,
  startFresh,
  fixOverspends,
} from '../thunks'
import {
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
  useMediaQuery,
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import Rhythm from 'components/Rhythm'
import { Tooltip } from 'components/Tooltip'

const getMonthName = date => format(date, 'LLL', { locale: ru }).toLowerCase()

export default function BudgetInfo({ month, index, onClose, ...rest }) {
  const currency = useSelector(getUserCurrencyCode)
  const totals = useSelector(state => getTotalsByMonth(state)[index])
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const {
    date,
    available,
    prevOverspent,
    toBeBudgeted,
    overspent,
    income,
    prevFunds,
    transferOutcome,
    transferFees,
    realBudgetedInFuture,
    budgeted,
    moneyInBudget,
    budgetedInFuture,
    outcome,
  } = totals

  const formatSum = sum => formatMoney(sum, currency)
  const dispatch = useDispatch()

  function Line({ name, amount }) {
    return (
      <Box display="flex" flexDirection="row">
        <Box flexGrow="1" mr={1} minWidth={0}>
          <Typography noWrap variant="body2">
            {name}
          </Typography>
        </Box>

        <Typography variant="body2">{formatSum(amount)}</Typography>
      </Box>
    )
  }

  return (
    <Box {...rest} minHeight="100vh">
      {isMobile && (
        <Box py={1} px={3} display="flex" alignItems="center">
          <Box flexGrow={1}>
            <Typography variant="h6" noWrap>
              {getMonthName(month)}
            </Typography>
          </Box>

          <Tooltip title="Закрыть">
            <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
          </Tooltip>
        </Box>
      )}

      <Rhythm gap={5} p={3}>
        <Box>
          <Typography
            align="center"
            variant="body2"
            color="textSecondary"
            children="Доход"
          />
          <Typography
            align="center"
            variant="h5"
            children={'+' + formatSum(income)}
          />
        </Box>

        <Box>
          <Typography
            align="center"
            variant="body2"
            color="textSecondary"
            children="Расход"
          />
          <Typography
            align="center"
            variant="h5"
            children={formatSum(-outcome)}
          />
        </Box>

        <Box>
          <Confirm
            title="Скопировать все бюджеты?"
            description="Бюджеты будут точно такими же, как в предыдущем месяце."
            onOk={() => dispatch(copyPreviousBudget(date))}
            okText="Скопировать"
            cancelText="Отмена"
          >
            <Button fullWidth color="secondary">
              Копировать бюджеты с прошлого месяца
            </Button>
          </Confirm>

          {!!overspent && (
            <Confirm
              title="Избавиться от перерасходов?"
              onOk={() => dispatch(fixOverspends(date))}
              okText="Покрыть перерасходы"
              cancelText="Отмена"
            >
              <Button fullWidth color="secondary">
                Покрыть перерасходы ({formatMoney(overspent, currency)})
              </Button>
            </Confirm>
          )}

          <Confirm
            title="Хотите начать всё заново?"
            description="Остатки во всех категориях сбросятся, а бюджеты в будущем удалятся. Вы сможете начать распределять деньги с чистого листа. Меняются только бюджеты, все остальные данные останутся как есть."
            onOk={() => dispatch(startFresh(date))}
            okText="Сбросить остатки"
            cancelText="Отмена"
          >
            <Button fullWidth color="secondary">
              Сбросить все остатки
            </Button>
          </Confirm>
        </Box>
      </Rhythm>

      {/* <Line name={`Распределено`} amount={available}  /> */}

      <Rhythm gap={1} py={2} px={3}>
        <Line name={`Все переводы`} amount={-transferOutcome} />
        <Line name={`Потери на переводах`} amount={-transferFees} />
        <Line name={`realBudgetedInFuture`} amount={realBudgetedInFuture} />
        <Line name={`В бюджете`} amount={moneyInBudget} />
      </Rhythm>
    </Box>
  )
}

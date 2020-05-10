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
import { Box, Typography, Button } from '@material-ui/core'
import Rhythm from 'components/Rhythm'

const getMonthName = date => format(date, 'LLL', { locale: ru }).toLowerCase()

export default function BudgetInfo({ month, index, onClose, ...rest }) {
  const currency = useSelector(getUserCurrencyCode)
  const totals = useSelector(state => getTotalsByMonth(state)[index])
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

  const [opened, setOpened] = useState(true)
  const formatSum = sum => formatMoney(sum, currency)
  const dispatch = useDispatch()

  return (
    <Box {...rest} p={3}>
      <Line
        name={`Доход за ${getMonthName(date)}`}
        amount={income}
        currency={currency}
      />
      <Line
        name={`Остаток с прошлого`}
        amount={prevFunds}
        currency={currency}
      />
      <Line
        name={`Перерасход в прошлом`}
        amount={-prevOverspent}
        currency={currency}
      />
      <Line
        name={`План на ${getMonthName(date)}`}
        amount={-budgeted}
        currency={currency}
      />
      <Line
        name={`Переводы`}
        amount={-transferOutcome - transferFees}
        currency={currency}
      />
      <Line
        name={`Запланировано в будущем`}
        amount={-budgetedInFuture}
        currency={currency}
      />

      <Rhythm gap={1}>
        <Typography align="center" variant="h5">
          Быстрые бюджеты
        </Typography>
        <Confirm
          title="Скопировать все бюджеты?"
          description="Бюджеты будут точно такими же, как в предыдущем месяце."
          onOk={() => dispatch(copyPreviousBudget(date))}
          okText="Скопировать"
          cancelText="Отмена"
        >
          <Button fullWidth>Копировать с прошлого месяца...</Button>
        </Confirm>

        <Confirm
          title="Выполнить все цели?"
          description="Бюджеты будут выставлены так, чтобы цели в этом месяце выполнились."
          onOk={() => dispatch(fillGoals(date))}
          okText="Выполнить цели"
          cancelText="Отмена"
        >
          <Button fullWidth>Выполнить цели на месяц</Button>
        </Confirm>

        <Confirm
          title="Хотите начать всё заново?"
          description="Остатки во всех категориях сбросятся, а бюджеты в будущем удалятся. Вы сможете начать распределять деньги с чистого листа. Меняются только бюджеты, все остальные данные останутся как есть."
          onOk={() => dispatch(startFresh(date))}
          okText="Сбросить остатки"
          cancelText="Отмена"
        >
          <Button fullWidth>Начать всё заново</Button>
        </Confirm>

        {!!overspent && (
          <Confirm
            title="Избавиться от перерасходов?"
            onOk={() => dispatch(fixOverspends(date))}
            okText="Покрыть перерасходы"
            cancelText="Отмена"
          >
            <Button fullWidth>Покрыть перерасходы</Button>
          </Confirm>
        )}
      </Rhythm>

      <Line name={`Распределено`} amount={available} currency={currency} />
      <Line name={`Перерасход`} amount={overspent} currency={currency} />
      <Line name={`Расход`} amount={outcome} currency={currency} />
      <Line
        name={`Все переводы`}
        amount={-transferOutcome}
        currency={currency}
      />
      <Line
        name={`Потери на переводах`}
        amount={-transferFees}
        currency={currency}
      />
      <Line
        name={`realBudgetedInFuture`}
        amount={realBudgetedInFuture}
        currency={currency}
      />
      <Line name={`В бюджете`} amount={moneyInBudget} currency={currency} />
    </Box>
  )
}

function Line({ name, amount, currency, onClick }) {
  return (
    <Box display="flex" flexDirection="row" mt={1} onClick={onClick}>
      <Box flexGrow="1" mr={1} minWidth={0}>
        <Typography noWrap>{name}</Typography>
      </Box>

      {(amount || amount === 0) && (
        <Typography>{formatMoney(amount, currency)}</Typography>
      )}
    </Box>
  )
}

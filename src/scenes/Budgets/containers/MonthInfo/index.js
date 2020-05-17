import React, { useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { MonthContext } from 'scenes/Budgets'
import { getTotalsByMonth } from '../../selectors/getTotalsByMonth'
// import { getAmountsByTag } from '../../selectors/getAmountsByTag'
import { getUserCurrencyCode } from 'store/serverData'
import Confirm from 'components/Confirm'
import { copyPreviousBudget, startFresh, fixOverspends } from '../../thunks'
import {
  Box,
  Typography,
  Button,
  IconButton,
  useMediaQuery,
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import Rhythm from 'components/Rhythm'
import { Tooltip } from 'components/Tooltip'
import { Total, Line } from '../components'
import { WidgetIncome } from './WidgetIncome'

const getMonthName = date => format(date, 'LLL', { locale: ru }).toUpperCase()

export default function BudgetInfo({ onClose, ...rest }) {
  const month = useContext(MonthContext)
  const currency = useSelector(getUserCurrencyCode)
  const totals = useSelector(getTotalsByMonth)[month]
  // const amounts = useSelector(getAmountsByTag)?.[month]
  // const tags = useSelector(getTagsTree)
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const {
    date,
    overspent,
    transferOutcome,
    transferFees,
    realBudgetedInFuture,
    moneyInBudget,
    outcome,
    // available,
    // prevOverspent,
    // toBeBudgeted,
    // prevFunds,
    // budgeted,
    // budgetedInFuture,
  } = totals

  const dispatch = useDispatch()

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
        {!!overspent && (
          <Box p={2} bgcolor="warning.light" color="">
            <Typography>
              В некоторых категориях отрицательный баланс. Добавьте туда денег.
            </Typography>
            <Button>Исправить автоматически</Button>
          </Box>
        )}
        <WidgetIncome />
        <Total name="Расход" value={-outcome} currency={currency} sign />
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
      </Rhythm>
    </Box>
  )
}

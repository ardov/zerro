import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { formatDate, formatMoney } from 'helpers/format'
import { getTotalsByMonth } from '../../selectors/getTotalsByMonth'
import { getUserCurrencyCode } from 'store/data/selectors'
import Confirm from 'components/Confirm'
import { copyPreviousBudget, startFresh, fixOverspends } from '../../thunks'
import {
  Box,
  Typography,
  Button,
  IconButton,
  useMediaQuery,
  Collapse,
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import Rhythm from 'components/Rhythm'
import { Tooltip } from 'components/Tooltip'
import { Line } from '../components'
import { WidgetIncome } from './WidgetIncome'
import { OverspentNotice } from './OverspentNotice'
import { CalculationErrorNotice } from './CalculationErrorNotice'
import { WidgetOutcome } from './WidgetOutcome'
import { useState } from 'react'
import { useMonth } from 'scenes/Budgets/pathHooks'

const getMonthName = date => formatDate(date, 'LLLL').toUpperCase()

export default function BudgetInfo({ onClose, ...rest }) {
  const [month] = useMonth()
  const currency = useSelector(getUserCurrencyCode)
  const totals = useSelector(getTotalsByMonth)[month]
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const [showMore, setShowMore] = useState(false)
  const toggleMore = () => setShowMore(state => !state)
  const {
    overspent,
    transferOutcome,
    transferFees,
    realBudgetedInFuture,
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

      <Rhythm gap={2} p={3}>
        <CalculationErrorNotice />
        {!!overspent && <OverspentNotice />}
        <WidgetIncome />
        <WidgetOutcome />

        <Box p={2} bgcolor="background.default" borderRadius={8}>
          <Box mb={1}>
            <Typography variant="body1" color="textSecondary" align="center">
              Быстрые бюджеты
            </Typography>
          </Box>
          <Confirm
            title="Скопировать все бюджеты?"
            description="Бюджеты будут точно такими же, как в предыдущем месяце."
            onOk={() => dispatch(copyPreviousBudget(month))}
            okText="Скопировать"
            cancelText="Отмена"
          >
            <Button fullWidth color="secondary">
              Копировать с прошлого месяца
            </Button>
          </Confirm>

          {!!overspent && (
            <Confirm
              title="Избавиться от перерасходов?"
              onOk={() => dispatch(fixOverspends(month))}
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
            onOk={() => dispatch(startFresh(month))}
            okText="Сбросить остатки"
            cancelText="Отмена"
          >
            <Button fullWidth color="secondary">
              Сбросить все остатки
            </Button>
          </Confirm>
        </Box>

        <Box display="flex" flexDirection="column" justifyContent="center">
          <Collapse in={showMore}>
            <Rhythm gap={1} width="100%" pb={1}>
              <Line
                name={
                  transferOutcome > 0
                    ? 'Переводы из бюджета'
                    : 'Переводы в бюджет'
                }
                description="Сумма переводов между счетами в бюджете и остальными"
                amount={
                  transferOutcome < 0 ? -transferOutcome : transferOutcome
                }
                currency={currency}
              />
              <Line
                name={`${transferFees > 0 ? 'Потери' : 'Доходы'} на переводах`}
                description="Здесь учитываются комиссии или переводы в валюту. Например, купили долларов, а потом они подорожали, разница будет тут."
                amount={-transferFees}
                currency={currency}
              />
              <Line
                name={`Все будущие бюджеты`}
                amount={realBudgetedInFuture}
                currency={currency}
              />
              {/* <Line
                name={`В бюджете`}
                amount={moneyInBudget}
                currency={currency}
              /> */}
            </Rhythm>
          </Collapse>

          <Button onClick={toggleMore} fullWidth>
            {showMore ? 'Меньше цифр' : 'Больше цифр'}
          </Button>
        </Box>
      </Rhythm>
    </Box>
  )
}

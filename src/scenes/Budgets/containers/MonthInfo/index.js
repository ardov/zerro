import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { formatMoney, getCurrencySymbol } from 'helpers/format'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { getTotalsByMonth } from '../../selectors/getTotalsByMonth'
import { getAmountsByTag } from '../../selectors/getAmountsByTag'
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
import { getTagsTree } from 'store/localData/tags'

const getMonthName = date => format(date, 'LLL', { locale: ru }).toLowerCase()

function IncomeData(month) {
  const currency = useSelector(getUserCurrencyCode)
  const tags = useSelector(getTagsTree)
  const amounts = useSelector(getAmountsByTag)?.[month]
  const income = useSelector(getTotalsByMonth)?.[month]?.income
  const incomeTags = tags.filter(tag => amounts[tag.id]?.totalIncome)
  const incomeData = incomeTags
    .map(tag => {
      return {
        id: tag.id,
        color: tag.colorGenerated,
        name: tag.title,
        amount: amounts[tag.id].totalIncome,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  return (
    <div>
      <Rhythm gap={1}>
        <Total name="Доход" value={income} currency={currency} sign />
        <PercentBar data={incomeData} />
        {incomeData.map(tag => (
          <Line
            key={tag.id}
            name={
              <>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    background: tag.color,
                    display: 'inline-block',
                    marginRight: 8,
                    borderRadius: '50%',
                  }}
                />
                {tag.name}
              </>
            }
            amount={tag.amount}
            currency={currency}
          />
        ))}
      </Rhythm>
    </div>
  )
}

export default function BudgetInfo({ month, index, onClose, ...rest }) {
  const currency = useSelector(getUserCurrencyCode)
  const totals = useSelector(getTotalsByMonth)[month]
  const amounts = useSelector(getAmountsByTag)?.[month]
  const tags = useSelector(getTagsTree)
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const {
    date,
    overspent,
    income,
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

  const incomeTags = tags.filter(tag => amounts[tag.id]?.totalIncome)

  const incomeData = incomeTags
    .map(tag => {
      return {
        id: tag.id,
        color: tag.colorGenerated,
        name: tag.title,
        amount: amounts[tag.id].totalIncome,
      }
    })
    .sort((a, b) => b.amount - a.amount)
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

        <div>
          <Rhythm gap={1}>
            <Total name="Доход" value={income} currency={currency} sign />
            <PercentBar data={incomeData} />
            {incomeData.map(tag => (
              <Line
                key={tag.id}
                name={
                  <>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        background: tag.color,
                        display: 'inline-block',
                        marginRight: 8,
                        borderRadius: '50%',
                      }}
                    />
                    {tag.name}
                  </>
                }
                amount={tag.amount}
                currency={currency}
              />
            ))}
          </Rhythm>
        </div>

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

function PercentBar({ data }) {
  return (
    <Box
      display="flex"
      width="100%"
      height="12px"
      borderRadius="6px"
      overflow="hidden"
    >
      {data.map((bar, i) => (
        <Tooltip title={bar.name} key={bar.id}>
          <Box
            flexBasis={bar.amount + '%'}
            minWidth="2px"
            pl={i === 0 ? 0 : '1px'}
          >
            <Box bgcolor={bar.color} height="100%" />
          </Box>
        </Tooltip>
      ))}
    </Box>
  )
}

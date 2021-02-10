import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Popover,
  IconButton,
} from '@material-ui/core'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import { formatMoney } from 'helpers/format'
import AmountInput from 'components/AmountInput'
import { getAmountsById } from 'scenes/Budgets/selectors/getAmountsByTag'
import { getUserCurrencyCode } from 'store/serverData'
import { setOutcomeBudget } from 'scenes/Budgets/thunks'
import { getGoals } from 'store/localData/hiddenData/goals'
import { getGoalsProgress } from 'scenes/Budgets/selectors/goalsProgress'
import { round } from 'helpers/currencyHelpers'
import { sendEvent } from 'helpers/tracking'

export default function BudgetPopover({ id, month, onClose, ...rest }) {
  const prevMonth = getPrevMonthMs(month)
  const prev12Months = getPrev12MonthsMs(month)
  const goal = useSelector(getGoals)?.[id]
  const goalProgress = useSelector(getGoalsProgress)?.[month]?.[id]
  const needForGoal = goalProgress?.target

  const currency = useSelector(getUserCurrencyCode)
  const amountsById = useSelector(getAmountsById)
  const amounts = amountsById?.[month]?.[id] || {}
  const prevAmounts = amountsById?.[prevMonth]?.[id] || {}
  const dispatch = useDispatch()
  const onChange = outcome => dispatch(setOutcomeBudget(outcome, month, id))

  const isChild = !amounts.children
  const budgeted = isChild ? amounts.budgeted : amounts.totalBudgeted
  const available = isChild ? amounts.available : amounts.totalAvailable
  const prevBudgeted = isChild
    ? prevAmounts.budgeted
    : prevAmounts.totalBudgeted
  const prevOutcome = isChild ? prevAmounts.outcome : prevAmounts.totalOutcome

  let prev12MonthsOutcomes = []
  for (let i = 0; i < prev12Months.length; i++) {
	  isChild 
	  ? prev12MonthsOutcomes.push(amountsById?.[prev12Months[i]]?.[id]?.outcome || {})
	  : prev12MonthsOutcomes.push(amountsById?.[prev12Months[i]]?.[id]?.totalOutcome || {})
  }
  const prev12MonthsAvgOutcome = getAvgMonthsOutcome(prev12MonthsOutcomes)
  
  const [value, setValue] = React.useState(budgeted)
  const changeAndCLose = value => {
    onClose()
    if (value !== budgeted) onChange(value)
  }

  const quickActions = [
    {
      text: 'Покрыть перерасход',
      amount: round(+budgeted - available),
      selected: false,
      condition: available < 0,
    },
    {
      text: 'Цель',
      amount: +needForGoal,
      selected: +value === +needForGoal,
      condition: !!goal && !!needForGoal,
    },
    {
      text: 'Средний расход за последний год',
      amount: +prev12MonthsAvgOutcome,
      selected: +value === +prev12MonthsAvgOutcome,
      condition: !!prev12MonthsAvgOutcome,
    },
    {
      text: 'Бюджет в прошлом месяце',
      amount: +prevBudgeted,
      selected: +value === +prevBudgeted,
      condition: !!prevBudgeted,
    },
    {
      text: 'Расход в прошлом месяце',
      amount: +prevOutcome,
      selected: +value === +prevOutcome,
      condition: !!prevOutcome,
    },
    {
      text: 'Сбросить остаток',
      amount: round(+budgeted - available),
      selected: false,
      condition: available > 0,
    },
    {
      text: 'Сумма дочерних категорий',
      amount: round(amounts.totalBudgeted - amounts.budgeted),
      selected: false,
      condition:
        !isChild &&
        amounts.budgeted &&
        amounts.budgeted !== amounts.totalBudgeted,
    },
  ]

  return (
    <Popover onClose={() => changeAndCLose(+value)} {...rest}>
      <AmountInput
        autoFocus
        value={value}
        fullWidth
        onChange={value => setValue(+value)}
        onEnter={value => changeAndCLose(+value)}
        helperText={`Остаток категории ${formatMoney(
          available + +value - budgeted,
          currency
        )}`}
        placeholder="0"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton edge="end" onClick={() => changeAndCLose(+value)}>
                <CheckCircleIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <List>
        {quickActions.map(({ text, amount, selected, condition }) =>
          condition ? (
            <ListItem
              button
              key={text}
              selected={selected}
              onClick={() => {
                sendEvent('Budgets: quick budget: ' + text)
                changeAndCLose(amount)
              }}
            >
              <ListItemText
                primary={text}
                secondary={formatMoney(amount, currency)}
              />
            </ListItem>
          ) : null
        )}
      </List>
    </Popover>
  )
}

function getPrev12MonthsMs(date) {
  let prevMonths = []
  let monthToAdd = date  // current month won't be added; only use it to get previous month
  for (let i = 0; i < 12; i++) {
    monthToAdd = getPrevMonthMs(monthToAdd)
    prevMonths.push(monthToAdd)
  }
  return prevMonths
}

function getPrevMonthMs(date) {
  const current = new Date(date)
  const yyyy = current.getFullYear()
  const mm = current.getMonth() - 1
  return +new Date(yyyy, mm)
}

function getAvgMonthsOutcome(outcomes) {
  let result = 0
  for (let i = 0; i < outcomes.length; i++) {
    if (typeof outcomes[i] === 'number') {
      const outcome = parseFloat(outcomes[i])
      result = result + outcome
    }
  }
  if (result !== 0) {
    result = result / 12
    return result.toFixed(2)
  }
  return 0
}
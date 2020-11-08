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
import { getAmountsForTag } from 'scenes/Budgets/selectors/getAmountsByTag'
import { getUserCurrencyCode } from 'store/serverData'
import { setOutcomeBudget } from 'scenes/Budgets/thunks'
import { getGoals } from 'store/localData/hiddenData/goals'
import { getGoalProgress } from 'scenes/Budgets/selectors/goalsProgress'
import { round } from 'helpers/currencyHelpers'
import { sendEvent } from 'helpers/tracking'

export default function BudgetPopover({ id, month, onClose, ...rest }) {
  const prevMonth = getPrevMonthMs(month)

  const goal = useSelector(state => getGoals(state)[id] || {})
  const goalProgress = useSelector(state => getGoalProgress(state, month, id))
  const needForGoal = goalProgress?.target

  const currency = useSelector(getUserCurrencyCode)
  const amounts = useSelector(state => getAmountsForTag(state)(month, id) || {})
  const prevAmounts = useSelector(
    state => getAmountsForTag(state)(prevMonth, id) || {}
  )
  const dispatch = useDispatch()
  const onChange = outcome => dispatch(setOutcomeBudget(outcome, month, id))

  const isChild = !amounts.children
  const budgeted = isChild ? amounts.budgeted : amounts.totalBudgeted
  const available = isChild ? amounts.available : amounts.totalAvailable
  const prevBudgeted = isChild
    ? prevAmounts.budgeted
    : prevAmounts.totalBudgeted
  const prevOutcome = isChild ? prevAmounts.outcome : prevAmounts.totalOutcome

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

function getPrevMonthMs(date) {
  const current = new Date(date)
  const yyyy = current.getFullYear()
  const mm = current.getMonth() - 1
  return +new Date(yyyy, mm)
}

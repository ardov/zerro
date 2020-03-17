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
import { getGoals } from 'store/localData/hiddenData'
import { getGoalProgress } from 'scenes/Budgets/selectors/goalsProgress'

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
        {!!goal && !!needForGoal && (
          <ListItem
            button
            selected={+value === +needForGoal}
            onClick={() => changeAndCLose(+needForGoal)}
          >
            <ListItemText
              primary="Цель"
              secondary={formatMoney(needForGoal, currency)}
            />
          </ListItem>
        )}

        {!!prevBudgeted && (
          <ListItem
            button
            selected={+value === +prevBudgeted}
            onClick={() => changeAndCLose(+prevBudgeted)}
          >
            <ListItemText
              primary="Бюджет в прошлом месяце"
              secondary={formatMoney(prevBudgeted, currency)}
            />
          </ListItem>
        )}

        {!!prevOutcome && (
          <ListItem
            button
            selected={+value === +prevOutcome}
            onClick={() => changeAndCLose(+prevOutcome)}
          >
            <ListItemText
              primary="Расход в прошлом месяце"
              secondary={formatMoney(prevOutcome, currency)}
            />
          </ListItem>
        )}

        {available !== 0 && (
          <ListItem
            button
            selected={+value === +prevOutcome}
            onClick={() => changeAndCLose(+budgeted - available)}
          >
            <ListItemText
              primary={
                available < 0 ? 'Покрыть перерасход' : 'Сбросить остаток'
              }
              secondary={formatMoney(+budgeted - available, currency)}
            />
          </ListItem>
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

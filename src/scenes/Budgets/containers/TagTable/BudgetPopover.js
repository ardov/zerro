import React from 'react'
import { connect } from 'react-redux'
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

function BudgetPopover({
  id,
  budgeted,
  available,
  prevBudgeted,
  prevSpend,
  currency,
  goal,
  needForGoal,
  onChange,
  onClose,
  ...rest
}) {
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

        {!!prevSpend && (
          <ListItem
            button
            selected={+value === +prevSpend}
            onClick={() => changeAndCLose(+prevSpend)}
          >
            <ListItemText
              primary="Расход в прошлом месяце"
              secondary={formatMoney(prevSpend, currency)}
            />
          </ListItem>
        )}

        {available !== 0 && (
          <ListItem
            button
            selected={+value === +prevSpend}
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

const mapStateToProps = (state, { month, id }) => {
  // TODO: add prevBudgeted and prevSpend
  const amounts = getAmountsForTag(state)(month, id)
  if (!amounts) return {}
  const goal = getGoals(state)[id]
  const isChild = !amounts.children
  return {
    budgeted: isChild ? amounts.budgeted : amounts.totalBudgeted,
    available: isChild ? amounts.available : amounts.totalAvailable,
    goal,
    needForGoal: goal?.amount,
    currency: getUserCurrencyCode(state),
  }
}

const mapDispatchToProps = (dispatch, { id, month }) => ({
  onChange: outcome => dispatch(setOutcomeBudget(outcome, month, id)),
})

export default connect(mapStateToProps, mapDispatchToProps)(BudgetPopover)

import React, { FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Popover,
  IconButton,
  PopoverProps,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { formatMoney } from 'helpers/format'
import { AmountInput } from 'components/AmountInput'
import {
  getAmountsById,
  TagAmounts,
  TagGroupAmounts,
} from 'scenes/Budgets/selectors/getAmountsByTag'
import { getUserCurrencyCode } from 'store/data/selectors'
import { setOutcomeBudget } from 'scenes/Budgets/thunks'
import { getGoals } from 'store/localData/hiddenData/goals'
import { getGoalsProgress } from 'scenes/Budgets/selectors/goalsProgress'
import { round } from 'helpers/currencyHelpers'
import { sendEvent } from 'helpers/tracking'
import pluralize from 'helpers/pluralize'

type BudgetPopoverProps = PopoverProps & {
  id: string
  month: number
}

export const BudgetPopover: FC<BudgetPopoverProps> = props => {
  const { id, month, onClose, ...rest } = props
  const prevMonth = getPrevMonthMs(month)
  const prev12Months = getPrev12MonthsMs(month)
  const goal = useSelector(getGoals)?.[id]
  const goalProgress = useSelector(getGoalsProgress)?.[month]?.[id]
  const needForGoal = goalProgress?.target || 0

  const currency = useSelector(getUserCurrencyCode)
  const amountsById = useSelector(getAmountsById)
  const tagAmounts = amountsById?.[month]?.[id] || {}
  const tagPrevAmounts = amountsById?.[prevMonth]?.[id] || {}
  const dispatch = useDispatch()
  const onChange = (outcome: number) =>
    dispatch(setOutcomeBudget(outcome, month, id))

  const { budgeted, available } = getDisplayAmounts(tagAmounts)
  const prevBudgeted = getDisplayAmounts(tagPrevAmounts).budgeted
  const prevOutcome = getDisplayAmounts(tagPrevAmounts).outcome

  let prevOutcomes: number[] = []
  prev12Months.forEach(month => {
    const amounts = amountsById?.[month]?.[id]
    if (amounts) {
      const { outcome } = getDisplayAmounts(amounts)
      prevOutcomes.push(outcome)
    }
  })

  const prevMonthsAvgOutcome = getAvgMonthsOutcome(prevOutcomes)

  const [value, setValue] = React.useState<number>(budgeted)
  const changeAndCLose = (value: number) => {
    onClose?.({}, 'escapeKeyDown')
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
      text: 'Сбросить остаток',
      amount: round(+budgeted - available),
      selected: false,
      condition: available > 0,
    },
    {
      text: 'Цель',
      amount: needForGoal,
      selected: +value === needForGoal,
      condition: !!goal && !!needForGoal,
    },
    {
      text: getAvgMonthsOutcomeName(prevOutcomes.length),
      amount: +prevMonthsAvgOutcome,
      selected: +value === +prevMonthsAvgOutcome,
      condition: !!prevMonthsAvgOutcome && prevOutcomes.length > 1,
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
      text: 'Сумма дочерних категорий',
      amount: round(
        (tagAmounts as TagGroupAmounts).totalBudgeted - tagAmounts.budgeted
      ),
      selected: false,
      condition:
        isGroup(tagAmounts) &&
        tagAmounts.budgeted &&
        tagAmounts.budgeted !== tagAmounts.totalBudgeted,
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
        signButtons="auto"
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

function getPrev12MonthsMs(date: string | number | Date) {
  let prevMonths = []
  let monthToAdd = date // current month won't be added; only use it to get previous month
  for (let i = 0; i < 12; i++) {
    monthToAdd = getPrevMonthMs(monthToAdd)
    prevMonths.push(monthToAdd)
  }
  return prevMonths
}

function getPrevMonthMs(date: string | number | Date) {
  const current = new Date(date)
  const yyyy = current.getFullYear()
  const mm = current.getMonth() - 1
  return +new Date(yyyy, mm)
}

function getAvgMonthsOutcome(outcomes: number[]) {
  if (!outcomes.length) return 0
  let sum = 0
  outcomes.forEach(outcome => (sum += outcome))
  return round(sum / outcomes.length)
}

function getAvgMonthsOutcomeName(number: number) {
  const s = 'Средний расход за '
  if (number === 12) return s + 'год'
  if (number === 6) return s + 'полгода'
  return s + number + ' ' + pluralize(number, ['месяц', 'месяца', 'месяцев'])
}

function isGroup(
  amounts: TagGroupAmounts | TagAmounts
): amounts is TagGroupAmounts {
  return amounts.children !== undefined
}

function getDisplayAmounts(amounts: TagGroupAmounts | TagAmounts) {
  const budgeted = amounts.totalBudgeted
  const available = amounts.totalAvailable
  const outcome = amounts.totalOutcome
  return { budgeted, available, outcome }
}

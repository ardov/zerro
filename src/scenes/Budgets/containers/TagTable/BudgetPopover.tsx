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
import {
  convertCurrency,
  getInstruments,
  getUserInstrument,
} from 'store/data/selectors'
import { setOutcomeBudget } from 'scenes/Budgets/thunks'
import { getGoals } from 'store/localData/hiddenData/goals'
import { getGoalsProgress } from 'scenes/Budgets/selectors/goalsProgress'
import { round } from 'helpers/currencyHelpers'
import { sendEvent } from 'helpers/tracking'
import pluralize from 'helpers/pluralize'
import { getMetaForTag } from 'store/localData/hiddenData/tagMeta'
import { getBudgetsByMonthAndTag } from 'store/localData/budgets'

type BudgetPopoverProps = PopoverProps & {
  id: string
  month: number
}

export const BudgetPopover: FC<BudgetPopoverProps> = props => {
  const { id, month, onClose, ...rest } = props

  const currConverter = useSelector(convertCurrency)
  const { currency } = useSelector(getMetaForTag(id))
  const instruments = useSelector(getInstruments)
  const userInstrument = useSelector(getUserInstrument)
  const tagInstrument = currency ? instruments[currency] : userInstrument
  const convert = {
    toMain: (v: number) =>
      v && tagInstrument && userInstrument
        ? round(currConverter(v, tagInstrument.id, userInstrument.id))
        : v,
    toTag: (v: number) =>
      v && tagInstrument && userInstrument
        ? round(currConverter(v, userInstrument.id, tagInstrument.id))
        : v,
  }
  const format = {
    main: (v: number) => formatMoney(v, userInstrument?.shortTitle),
    tag: (v: number) => formatMoney(v, tagInstrument?.shortTitle),
  }

  const prevMonth = getPrevMonthMs(month)
  const goal = useSelector(getGoals)?.[id]
  const goalProgress = useSelector(getGoalsProgress)?.[month]?.[id]
  const budget = useSelector(getBudgetsByMonthAndTag)?.[month]?.[id]

  const needForGoal = convert.toTag(goalProgress?.target || 0)

  const amountsById = useSelector(getAmountsById)
  const tagAmounts = amountsById?.[month]?.[id] || {}
  const tagPrevAmounts = amountsById?.[prevMonth]?.[id] || {}
  const dispatch = useDispatch()
  const onChange = (outcome: number) =>
    dispatch(setOutcomeBudget(outcome, month, id))

  const budgeted = tagAmounts.totalBudgeted
  const available = tagAmounts.totalAvailable
  const prevBudgeted = tagPrevAmounts.totalBudgeted
  const prevOutcome = tagPrevAmounts.totalOutcome

  const oBudgeted = budget?.outcome || 0

  let prevOutcomes: number[] = getPrev12MonthsMs(month)
    .map(month => amountsById?.[month]?.[id]?.totalOutcome)
    .filter(outcome => outcome !== undefined)

  const avgOutcome = getAverage(prevOutcomes)

  const [value, setValue] = React.useState<number>(oBudgeted)
  const changeAndClose = (value: number) => {
    onClose?.({}, 'escapeKeyDown')
    console.log(value)
    if (value !== budgeted) onChange(value)
  }

  const quickActions = [
    {
      text: 'Покрыть перерасход',
      amount: convert.toTag(+budgeted - available),
      selected: false,
      condition: available < 0,
    },
    {
      text: 'Сбросить остаток',
      amount: convert.toTag(+budgeted - available),
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
      text: getAvgOutcomeName(prevOutcomes.length),
      amount: convert.toTag(avgOutcome),
      selected: +value === convert.toTag(avgOutcome),
      condition: !!avgOutcome && prevOutcomes.length > 1,
    },
    {
      text: 'Бюджет в прошлом месяце',
      amount: convert.toTag(prevBudgeted),
      selected: +value === convert.toTag(prevBudgeted),
      condition: !!prevBudgeted,
    },
    {
      text: 'Расход в прошлом месяце',
      amount: convert.toTag(prevOutcome),
      selected: +value === convert.toTag(prevOutcome),
      condition: !!prevOutcome,
    },
    {
      text: 'Сумма дочерних категорий',
      amount: convert.toTag(tagAmounts.totalBudgeted - tagAmounts.budgeted),
      selected: false,
      condition:
        isGroup(tagAmounts) &&
        tagAmounts.budgeted &&
        tagAmounts.totalBudgeted &&
        tagAmounts.budgeted !== tagAmounts.totalBudgeted,
    },
  ]

  const convertedValue = convert.toMain(value)
  const availableAfter = {
    tag: convert.toTag(available + convertedValue - budgeted),
    get main() {
      return convert.toMain(this.tag)
    },
  }

  const helperText = currency ? (
    <>
      {format.main(convertedValue)}
      <br />
      Остаток категории {format.tag(availableAfter.tag)} (
      {format.main(availableAfter.main)})
    </>
  ) : (
    `Остаток категории ${format.main(available + value - budgeted)}`
  )

  return (
    <Popover onClose={() => changeAndClose(+value)} {...rest}>
      <AmountInput
        autoFocus
        value={value}
        fullWidth
        onChange={value => setValue(+value)}
        onEnter={value => changeAndClose(+value)}
        helperText={helperText}
        signButtons="auto"
        placeholder="0"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {tagInstrument?.symbol}
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton edge="end" onClick={() => changeAndClose(+value)}>
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
                changeAndClose(amount)
              }}
            >
              <ListItemText primary={text} secondary={format.tag(amount)} />
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

function getAverage(outcomes: number[]) {
  if (!outcomes.length) return 0
  let sum = 0
  outcomes.forEach(outcome => (sum += outcome))
  return round(sum / outcomes.length)
}

function getAvgOutcomeName(number: number) {
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

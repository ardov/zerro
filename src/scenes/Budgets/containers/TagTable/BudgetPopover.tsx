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

  const needForGoal = convert.toTag(goalProgress?.target || 0)

  const amountsById = useSelector(getAmountsById)
  const tagAmounts = amountsById?.[month]?.[id] || {}
  const tagPrevAmounts = amountsById?.[prevMonth]?.[id] || {}
  const dispatch = useDispatch()
  const onChange = (outcome: number) =>
    dispatch(setOutcomeBudget(outcome, month, id))

  const totalBudgeted = convert.toTag(tagAmounts.totalBudgeted)
  const budgeted = convert.toTag(tagAmounts.budgeted)
  const available = convert.toTag(tagAmounts.totalAvailable)
  const prevBudgeted = convert.toTag(tagPrevAmounts.totalBudgeted)
  const prevOutcome = convert.toTag(tagPrevAmounts.totalOutcome)

  let prevOutcomes: number[] = getPrev12MonthsMs(month)
    .map(month => amountsById?.[month]?.[id]?.totalOutcome)
    .filter(outcome => outcome !== undefined)

  const avgOutcome = getAverage(prevOutcomes)

  const [value, setValue] = React.useState<number>(totalBudgeted)
  const changeAndClose = (value: number) => {
    onClose?.({}, 'escapeKeyDown')
    if (value !== totalBudgeted) onChange(value)
  }

  const quickActions = [
    {
      text: 'Покрыть перерасход',
      amount: round(+totalBudgeted - available),
      selected: false,
      condition: available < 0,
    },
    {
      text: 'Сбросить остаток',
      amount: round(+totalBudgeted - available),
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
      amount: avgOutcome,
      selected: +value === avgOutcome,
      condition: !!avgOutcome && prevOutcomes.length > 1,
    },
    {
      text: 'Бюджет в прошлом месяце',
      amount: prevBudgeted,
      selected: +value === prevBudgeted,
      condition: !!prevBudgeted,
    },
    {
      text: 'Расход в прошлом месяце',
      amount: prevOutcome,
      selected: +value === prevOutcome,
      condition: !!prevOutcome,
    },
    {
      text: 'Сумма дочерних категорий',
      amount: round(totalBudgeted - budgeted),
      selected: false,
      condition:
        isGroup(tagAmounts) &&
        budgeted &&
        totalBudgeted &&
        budgeted !== totalBudgeted,
    },
  ]

  const availableAfter = round(available + value - totalBudgeted)
  const valueInMain = convert.toMain(value)
  const availableAfterInMain = convert.toMain(availableAfter)

  const helperText = currency ? (
    <>
      {format.main(valueInMain)}
      <br />
      Остаток категории {format.tag(availableAfter)} (
      {format.main(availableAfterInMain)})
    </>
  ) : (
    `Остаток категории ${format.main(availableAfterInMain)}`
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

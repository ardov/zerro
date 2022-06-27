import React, { FC, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from 'models'
import {
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
  Popover,
  IconButton,
  PopoverProps,
} from '@mui/material'
import { CheckCircleIcon } from 'shared/ui/Icons'
import { formatMoney } from 'shared/helpers/format'
import { AmountInput } from 'shared/ui/AmountInput'
import { getAmountsById } from 'pages/Budgets/selectors'
import {
  convertCurrency,
  getInstruments,
  getUserInstrument,
} from 'models/instrument'
import { setOutcomeBudget } from 'pages/Budgets/thunks'
import { getGoals } from 'models/hiddenData/goals'
import { getGoalsProgress } from 'pages/Budgets/selectors'
import { round } from 'shared/helpers/currencyHelpers'
import { sendEvent } from 'shared/helpers/tracking'
import pluralize from 'shared/helpers/pluralize'
import { getMetaForTag } from 'models/hiddenData/tagMeta'
import { Box, BoxProps } from '@mui/system'
import { TDateDraft, TISOMonth } from 'shared/types'
import { toISOMonth } from 'shared/helpers/date'

export const BudgetPopover: FC<
  PopoverProps & {
    id: string
    month: TISOMonth
  }
> = props => {
  const { id, month, onClose, ...rest } = props

  const currConverter = useAppSelector(convertCurrency)
  const { currency } = useAppSelector(getMetaForTag(id))
  const instruments = useAppSelector(getInstruments)
  const userInstrument = useAppSelector(getUserInstrument)
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

  const prevMonth = getPrevMonth(month)
  const goal = useAppSelector(getGoals)?.[id]
  const goalProgress = useAppSelector(getGoalsProgress)?.[month]?.[id]

  const amountsById = useAppSelector(getAmountsById)
  const tagAmounts = amountsById?.[month]?.[id] || {}
  const tagPrevAmounts = amountsById?.[prevMonth]?.[id] || {}
  const dispatch = useAppDispatch()
  const onChange = (outcome: number) =>
    dispatch(setOutcomeBudget(outcome, month, id))

  const totalBudgeted = convert.toTag(tagAmounts.totalBudgeted)
  const totalAvailable = convert.toTag(tagAmounts.totalAvailable)

  useEffect(() => {
    setValue(totalBudgeted)
  }, [totalBudgeted])

  let prevOutcomes: number[] = getPrev12MonthsISO(month)
    .map(month => amountsById?.[month]?.[id]?.totalOutcome)
    .filter(outcome => outcome !== undefined)

  const [value, setValue] = React.useState<number>(totalBudgeted)
  const changeAndClose = (value: number) => {
    onClose?.({}, 'escapeKeyDown')
    if (value !== totalBudgeted) onChange(value)
  }

  const quickActions = getQuickActions({
    hasChildren: !!tagAmounts.children,
    budgeted: convert.toTag(tagAmounts.budgeted),
    totalBudgeted: convert.toTag(tagAmounts.totalBudgeted),
    available: convert.toTag(tagAmounts.available),
    totalAvailable: convert.toTag(tagAmounts.totalAvailable),
    hasGoal: !!goal,
    goalTarget: convert.toTag(goalProgress?.target || 0),
    prevOutcomesLength: prevOutcomes.length,
    avgOutcome: getAverage(prevOutcomes),
    prevBudgeted: convert.toTag(tagPrevAmounts.totalBudgeted),
    prevOutcome: convert.toTag(tagPrevAmounts.totalOutcome),
  })

  const availableAfter = round(totalAvailable + value - totalBudgeted)
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
        {quickActions.map(({ text, amount }) => (
          <ListItemButton
            key={text}
            selected={value === amount}
            onClick={() => {
              sendEvent('Budgets: quick budget: ' + text)
              changeAndClose(amount)
            }}
          >
            <ListItemText
              primary={<NameValueRow name={text} value={format.tag(amount)} />}
            />
            {/* <ListItemText primary={format.tag(amount)} /> */}
          </ListItemButton>
        ))}
      </List>
    </Popover>
  )
}

function getQuickActions({
  hasChildren,
  budgeted,
  totalBudgeted,
  available,
  totalAvailable,
  hasGoal,
  goalTarget,
  prevOutcomesLength,
  avgOutcome,
  prevBudgeted,
  prevOutcome,
}: {
  hasChildren: boolean
  budgeted: number
  totalBudgeted: number
  available: number
  totalAvailable: number
  hasGoal: boolean
  goalTarget: number
  prevOutcomesLength: number
  avgOutcome: number
  prevBudgeted: number
  prevOutcome: number
}) {
  return [
    {
      text: 'Покрыть перерасход',
      amount: round(+totalBudgeted - available),
      condition: hasChildren && available < 0 && totalAvailable >= 0,
    },
    {
      text: 'Покрыть перерасход',
      amount: round(+totalBudgeted - totalAvailable),
      condition: totalAvailable < 0,
    },
    {
      text: 'Сбросить остаток',
      amount: round(+totalBudgeted - totalAvailable),
      condition: totalAvailable > 0,
    },
    {
      text: 'Цель',
      amount: goalTarget,
      condition: hasGoal && !!goalTarget,
    },
    {
      text: getAvgOutcomeName(prevOutcomesLength),
      amount: avgOutcome,
      condition: !!avgOutcome && prevOutcomesLength > 1,
    },
    {
      text: 'Прошлый бюджет',
      amount: prevBudgeted,
      condition: !!prevBudgeted,
    },
    {
      text: 'Прошлый расход',
      amount: prevOutcome,
      condition: !!prevOutcome,
    },
    {
      text: 'Сумма дочерних категорий',
      amount: round(totalBudgeted - budgeted),
      condition:
        hasChildren &&
        !!budgeted &&
        !!totalBudgeted &&
        budgeted !== totalBudgeted,
    },
  ].filter(action => action.condition)
}

function getPrev12MonthsISO(date: TDateDraft): TISOMonth[] {
  let prevMonths: TISOMonth[] = []
  let monthToAdd = toISOMonth(date) // current month won't be added; only use it to get previous month
  for (let i = 0; i < 12; i++) {
    monthToAdd = getPrevMonth(monthToAdd)
    prevMonths.push(monthToAdd)
  }
  return prevMonths
}

function getPrevMonth(date: TDateDraft): TISOMonth {
  const current = new Date(date)
  const yyyy = current.getFullYear()
  const mm = current.getMonth() - 1
  return toISOMonth(new Date(yyyy, mm))
}

function getAverage(outcomes: number[]) {
  if (!outcomes.length) return 0
  let sum = 0
  outcomes.forEach(outcome => (sum += outcome))
  return round(sum / outcomes.length)
}

function getAvgOutcomeName(number: number) {
  const s = 'Средний расход за '
  if (number === 12) return s + 'год'
  if (number === 6) return s + 'полгода'
  return s + number + ' ' + pluralize(number, ['месяц', 'месяца', 'месяцев'])
}

const NameValueRow: FC<BoxProps & { name: string; value: string }> = ({
  name,
  value,
  ...rest
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        gap: 2,
        '& > :first-child': { flexGrow: 1 },
        '& > :last-child': { color: 'text.secondary' },
      }}
      {...rest}
    >
      <span>{name}</span>
      <span>{value}</span>
    </Box>
  )
}

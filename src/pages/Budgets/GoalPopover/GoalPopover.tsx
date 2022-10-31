import React, { useState, FC } from 'react'
import { useAppDispatch } from '@store'
import {
  Box,
  Popover,
  TextField,
  MenuItem,
  Button,
  IconButton,
  PopoverProps,
  OutlinedTextFieldProps,
} from '@mui/material'
import { AmountInput } from '@shared/ui/AmountInput'
import { CloseIcon } from '@shared/ui/Icons'
import MonthSelectPopover from '@shared/ui/MonthSelectPopover'
import { toISODate, formatDate } from '@shared/helpers/date'
import { TDateDraft, TEnvelopeId, TISOMonth } from '@shared/types'

import { goalModel, goalType, TGoal } from '@entities/goal'
import { useMonthTotals } from '@entities/envelopeData'

const amountLabels = {
  [goalType.MONTHLY]: 'Откладывать каждый месяц',
  [goalType.MONTHLY_SPEND]: 'Нужно на месяц',
  [goalType.TARGET_BALANCE]: 'Хочу накопить',
  [goalType.INCOME_PERCENT]: 'Процент от дохода',
}

type TGoalPopoverProps = PopoverProps & {
  id: TEnvelopeId
  month: TISOMonth
}

export const GoalPopover: FC<
  PopoverProps & {
    id?: TEnvelopeId
    month?: TISOMonth
  }
> = ({ id, month, ...props }) => {
  if (!id || !month) return null
  return <GoalPopoverContent id={id} month={month} {...props} />
}

const GoalPopoverContent: FC<TGoalPopoverProps> = props => {
  const { id, month, onClose, ...rest } = props
  const dispatch = useAppDispatch()
  const envelope = useMonthTotals(month).envelopes[id]
  const { goal } = envelope
  const { currency } = envelope.env

  const [type, setType] = useState(goal?.type || goalType.MONTHLY_SPEND)
  const isInPercents = type === goalType.INCOME_PERCENT
  const [rawValue, setRawValue] = useState(getInput(goal?.amount))
  const [endDate, setEndDate] = useState<TGoal['end']>(goal?.end)

  const [monthPopoverAnchor, setMonthPopoverAnchor] =
    useState<typeof props['anchorEl']>(null)
  if (!id || !month) return null

  const handleTypeChange: OutlinedTextFieldProps['onChange'] = e =>
    setType(e.target.value as goalType)
  const openMonthPopover = () => setMonthPopoverAnchor(props.anchorEl)
  const closeMonthPopover = () => setMonthPopoverAnchor(null)
  const handleDateChange = (date?: TDateDraft) => {
    closeMonthPopover()
    setEndDate(date ? toISODate(date) : undefined)
  }
  const removeDate = () => handleDateChange(undefined)

  const save = () => {
    const amount = getAmount(rawValue)
    const hasChanges =
      amount !== goal?.amount || type !== goal?.type || endDate !== goal?.end

    if (hasChanges) {
      const goal: TGoal = { type, amount }
      if (type === goalType.TARGET_BALANCE && endDate) {
        goal.end = endDate
      }
      dispatch(goalModel.set(month, id, goal))
    }
    onClose?.({}, 'escapeKeyDown')
  }
  const removeGoal = () => {
    dispatch(goalModel.set(month, id, null))
    onClose?.({}, 'escapeKeyDown')
  }

  const showDateBlock = type === goalType.TARGET_BALANCE

  return (
    <>
      <Popover disableRestoreFocus onClose={onClose} {...rest}>
        <Box display="grid" rowGap={2} p={2} minWidth={320}>
          <TextField
            select
            variant="outlined"
            value={type}
            onChange={handleTypeChange}
            label="Тип цели"
            fullWidth
          >
            <MenuItem value={goalType.MONTHLY}>Регулярные сбережения</MenuItem>
            <MenuItem value={goalType.MONTHLY_SPEND}>Сумма на месяц</MenuItem>
            <MenuItem value={goalType.TARGET_BALANCE}>Накопить сумму</MenuItem>
            <MenuItem value={goalType.INCOME_PERCENT}>
              Процент от дохода
            </MenuItem>
          </TextField>

          <AmountInput
            autoFocus
            onFocus={e => e.target.select()}
            selectOnFocus
            value={rawValue}
            label={amountLabels[type]}
            fullWidth
            onChange={value => setRawValue(+value)}
            onEnter={value => {
              setRawValue(+value)
              save()
            }}
            currency={isInPercents ? '%' : currency}
            placeholder="0"
          />

          {showDateBlock && (
            <Box display="flex">
              <Button
                size="large"
                onClick={openMonthPopover}
                fullWidth={!endDate}
              >
                {endDate
                  ? formatDate(endDate, 'LLLL yyyy').toUpperCase()
                  : 'К определённой дате'}
              </Button>
              {endDate && (
                <IconButton onClick={removeDate} children={<CloseIcon />} />
              )}
            </Box>
          )}

          <Button onClick={save} variant="contained" color="primary">
            Сохранить цель
          </Button>
          {!!goal?.amount && (
            <Button onClick={removeGoal} variant="outlined" color="error">
              Удалить цель
            </Button>
          )}
        </Box>
      </Popover>

      <MonthSelectPopover
        open={!!monthPopoverAnchor}
        anchorEl={monthPopoverAnchor}
        onClose={closeMonthPopover}
        onChange={handleDateChange}
        value={endDate}
        disablePast
      />
    </>
  )

  function getAmount(input: string | number) {
    if (!+input) return 0
    return isInPercents ? +input / 100 : +input
  }

  function getInput(goalAmount: undefined | number) {
    if (!goalAmount) return 0
    return isInPercents ? +goalAmount * 100 : +goalAmount
  }
}

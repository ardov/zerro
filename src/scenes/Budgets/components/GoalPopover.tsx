import React, { useState, FC } from 'react'
import { useAppDispatch, useAppSelector } from 'store'
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
import { AmountInput } from 'components/AmountInput'
import { getGoals, setGoal, deleteGoal } from 'store/data/hiddenData/goals'
import { goalType } from 'store/data/hiddenData/constants'
import { CloseIcon } from 'components/Icons'
import MonthSelectPopover from 'scenes/Budgets/MonthSelectPopover'
import { formatDate } from 'shared/helpers/format'

const { MONTHLY, MONTHLY_SPEND, TARGET_BALANCE } = goalType

const amountLabels = {
  [MONTHLY]: 'Откладывать каждый месяц',
  [MONTHLY_SPEND]: 'Нужно на месяц',
  [TARGET_BALANCE]: 'Хочу накопить',
}

export const GoalPopover: FC<PopoverProps & { id: string }> = props => {
  const { id, onClose, ...rest } = props
  const dispatch = useAppDispatch()
  const goal = useAppSelector(getGoals)[id] || {}

  const [amount, setAmount] = useState(goal.amount || 0)
  const [type, setType] = useState(goal.type || MONTHLY_SPEND)
  const [endDate, setEndDate] = useState(goal.end)

  const [monthPopoverAnchor, setMonthPopoverAnchor] =
    useState<typeof props['anchorEl']>(null)

  const handleTypeChange: OutlinedTextFieldProps['onChange'] = e =>
    setType(e.target.value as goalType)
  const openMonthPopover = () => setMonthPopoverAnchor(props.anchorEl)
  const closeMonthPopover = () => setMonthPopoverAnchor(null)
  const handleDateChange = (date?: number) => {
    closeMonthPopover()
    setEndDate(date)
  }
  const removeDate = () => handleDateChange(undefined)
  const save = () => {
    if (amount !== goal.amount || type !== goal.type || endDate !== goal.end) {
      dispatch(setGoal({ type, amount, end: endDate, tag: id }))
    }
    onClose?.({}, 'escapeKeyDown')
  }
  const removeGoal = () => {
    dispatch(deleteGoal(id))
    onClose?.({}, 'escapeKeyDown')
  }

  const showDateBlock = type === TARGET_BALANCE

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
            <MenuItem value={MONTHLY}>Регулярные сбережения</MenuItem>
            <MenuItem value={MONTHLY_SPEND}>Сумма на месяц</MenuItem>
            <MenuItem value={TARGET_BALANCE}>Накопить сумму</MenuItem>
          </TextField>

          <AmountInput
            autoFocus
            onFocus={e => e.target.select()}
            selectOnFocus
            value={amount}
            label={amountLabels[type]}
            fullWidth
            onChange={value => setAmount(+value)}
            onEnter={value => {
              setAmount(+value)
              save()
            }}
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
          {!!goal.amount && (
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
}

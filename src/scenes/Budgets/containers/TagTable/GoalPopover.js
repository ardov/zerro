import React, { useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Popover,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Typography,
} from '@material-ui/core'
import AmountInput from 'components/AmountInput'
import { getGoals, setGoal } from 'store/localData/hiddenData'
import { GOAL_TYPES } from 'store/localData/hiddenData/constants'
import CloseIcon from '@material-ui/icons/Close'
import MonthSelectPopover from 'scenes/Budgets/MonthSelectPopover'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'

const { MONTHLY, MONTHLY_SPEND, TARGET_BALANCE } = GOAL_TYPES

const amountLabels = {
  [MONTHLY]: 'Откладывать каждый месяц',
  [MONTHLY_SPEND]: 'Нужно на месяц',
  [TARGET_BALANCE]: 'Хочу накопить',
}

export default function GoalPopover({ id, currency, onClose, ...rest }) {
  const dispatch = useDispatch()
  const goal = useSelector(state => getGoals(state)[id] || {})

  const [amount, setAmount] = useState(goal.amount)
  const [type, setType] = useState(goal.type || MONTHLY_SPEND)
  const [endDate, setEndDate] = useState(goal.end)
  const popoverRef = useRef()
  const [monthPopoverAnchor, setMonthPopoverAnchor] = useState(null)

  const handleTypeChange = e => setType(e.target.value)
  const openMonthPopover = () => setMonthPopoverAnchor(popoverRef.current)
  const closeMonthPopover = () => setMonthPopoverAnchor(null)
  const handleDateChange = date => {
    closeMonthPopover()
    setEndDate(date)
  }
  const removeDate = () => handleDateChange(null)
  const save = () => {
    if (amount !== goal.amount || type !== goal.type || endDate !== goal.end) {
      dispatch(setGoal({ type, amount, end: endDate, tag: id }))
    }
    onClose()
  }

  const showDateBlock = type === TARGET_BALANCE

  return (
    <>
      <Popover disableRestoreFocus onClose={onClose} {...rest}>
        <Box
          ref={popoverRef}
          display="grid"
          gridRowGap={16}
          p={2}
          minWidth={320}
        >
          <TextField
            select
            variant="outlined"
            value={type}
            onChange={handleTypeChange}
            label="Тип цели"
            fullWidth
          >
            <MenuItem value={MONTHLY}>Регулярные сбережения</MenuItem>
            <MenuItem value={MONTHLY_SPEND}>Регулярные траты</MenuItem>
            <MenuItem value={TARGET_BALANCE}>Накопить сумму</MenuItem>
          </TextField>

          <AmountInput
            autoFocus
            onFocus={e => e.target.select()}
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
            <Box>
              <Button onClick={openMonthPopover}>
                <Typography>
                  {endDate
                    ? format(endDate, 'LLLL yyyy', { locale: ru }).toUpperCase()
                    : 'Указать дату'}
                </Typography>
              </Button>
              {endDate && (
                <IconButton onClick={removeDate} children={<CloseIcon />} />
              )}
            </Box>
          )}

          <Button onClick={save} variant="contained" color="primary">
            Сохранить цель
          </Button>
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

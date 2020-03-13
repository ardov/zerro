import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Box, Popover, TextField, MenuItem } from '@material-ui/core'
import AmountInput from 'components/AmountInput'
import { getGoals, setGoal } from 'store/localData/hiddenData'
import { GOAL_TYPES } from 'store/localData/hiddenData/constants'

const { MONTHLY, MONTHLY_SPEND, TARGET_BALANCE } = GOAL_TYPES

const amountLabels = {
  [MONTHLY]: 'Сумма в месяц',
  [MONTHLY_SPEND]: 'Сумма в месяц',
  [TARGET_BALANCE]: 'Цель',
}

export function GoalPopover({
  currency,
  type = MONTHLY,
  amount = 0,
  end = '',
  date,
  onChange,
  onClose,
  ...rest
}) {
  const [value, setValue] = useState(amount)
  const [vType, setVType] = useState(type)
  const [vDate, setVDate] = useState(end)

  const handleTypeChange = e => setVType(e.target.value)
  const handleDateChange = e => setVDate(e.target.value)
  const save = () => {
    if (value !== amount || vType !== type || vDate !== end) {
      onChange({ type: vType, amount: value, date, end: vDate })
    }
    onClose()
  }

  return (
    <Popover disableRestoreFocus onClose={save} {...rest}>
      <Box m={2}>
        <TextField
          select
          variant="outlined"
          value={vType}
          onChange={handleTypeChange}
          label="Тип цели"
          fullWidth
        >
          <MenuItem value={MONTHLY}>Регулярные сбережения</MenuItem>
          <MenuItem value={MONTHLY_SPEND}>Регулярные траты</MenuItem>
          <MenuItem value={TARGET_BALANCE}>Накопить сумму</MenuItem>
        </TextField>
      </Box>

      {vType === TARGET_BALANCE && (
        <Box m={2}>
          <TextField
            select
            variant="outlined"
            value={vDate}
            onChange={handleDateChange}
            label="К дате"
            fullWidth
          >
            <MenuItem value="">Без даты</MenuItem>
            <MenuItem value={+new Date(2020, 8)}>сентябрь</MenuItem>
          </TextField>
        </Box>
      )}

      <Box m={2}>
        <AmountInput
          autoFocus
          onFocus={e => e.target.select()}
          value={value}
          label={amountLabels[vType]}
          fullWidth
          onChange={value => setValue(+value)}
          onEnter={value => {
            setValue(+value)
            save()
          }}
          placeholder="0"
        />
      </Box>
    </Popover>
  )
}

const mapStateToProps = (state, { id }) => getGoals(state)[id] || {}

const mapDispatchToProps = (dispatch, { id }) => ({
  onChange: goal => dispatch(setGoal({ ...goal, tag: id })),
})

export default connect(mapStateToProps, mapDispatchToProps)(GoalPopover)

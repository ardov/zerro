import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Box, Popover, TextField, MenuItem } from '@material-ui/core'
import AmountInput from 'components/AmountInput'
import { getGoals, setGoal } from 'store/localData/hiddenData'
import { GOAL_TYPES } from 'store/localData/hiddenData/constants'

const { MONTHLY, MONTHLY_SPEND, TARGET_BALANCE } = GOAL_TYPES

export function GoalPopover({
  currency,
  type = MONTHLY,
  amount = 0,
  date,
  onChange,
  onClose,
  ...rest
}) {
  const [value, setValue] = useState(amount)
  const [vType, setVType] = useState(type)
  // const [vDate, setVDate] = useState(date)

  const handleTypeChange = e => setVType(e.target.value)
  const save = () => {
    if (value !== amount || vType !== type) {
      onChange({ type: vType, amount: value, date })
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
          label="Хочу"
          fullWidth
        >
          <MenuItem value={MONTHLY}>Откладывать каждый месяц</MenuItem>
          <MenuItem value={MONTHLY_SPEND}>Тратить каждый месяц</MenuItem>
          <MenuItem disabled value={TARGET_BALANCE}>
            Накопить сумму
          </MenuItem>
        </TextField>
      </Box>

      <Box m={2}>
        <AmountInput
          autoFocus
          onFocus={e => e.target.select()}
          value={value}
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

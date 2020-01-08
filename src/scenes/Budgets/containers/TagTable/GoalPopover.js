import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Box, Popover, TextField, MenuItem } from '@material-ui/core'
import { formatMoney } from 'helpers/format'
import AmountInput from 'components/AmountInput'
import { getGoals } from 'store/localData/budgets'
import { setGoal } from 'store/localData/budgets/thunks'

export function GoalPopover({
  currency,
  type = 'monthly',
  amount = 0,
  date,
  onChange,
  onClose,
  ...rest
}) {
  const [value, setValue] = useState(amount)
  const [vType, setVType] = useState(type)
  const [vDate, setVDate] = useState(date)

  const handleTypeChange = e => setVType(e.target.value)
  const save = () => {
    if (value !== amount || vType !== type || vDate !== date) {
      onChange({ type: vType, amount: value, date: vDate })
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
          <MenuItem value="monthly">Откладывать каждый месяц</MenuItem>
          <MenuItem disabled value="target">
            Накопить сумму
          </MenuItem>
          <MenuItem disabled value="targetByDate">
            Накопить сумму к дате
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

const mapStateToProps = (state, { tag }) => getGoals(state)[tag] || {}

const mapDispatchToProps = (dispatch, { tag }) => ({
  onChange: goal => dispatch(setGoal({ ...goal, tag })),
})

export default connect(mapStateToProps, mapDispatchToProps)(GoalPopover)

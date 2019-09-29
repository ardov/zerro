import React from 'react'
import { formatMoney } from 'helpers/format'

import {
  OutlinedInput,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
} from '@material-ui/core'
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown'

export default function BudgetCell({
  budgeted,
  available,
  id,
  isChild,
  date,
  onUpdate,
}) {
  const [budgetedClone, setBudgetedClone] = React.useState(budgeted)
  const [isVisible, setVisible] = React.useState(isChild ? !!budgeted : true)
  const [anchorEl, setAnchorEl] = React.useState(null)

  const inputRef = React.createRef()

  const handleClick = event => setAnchorEl(inputRef.current)
  const handleClose = () => setAnchorEl(null)

  const showInput = () => setVisible(true)

  const onChange = e => {
    setBudgetedClone(e.target.value)
    onUpdate(e.target.value, date, id)
  }

  const resetAvailable = () => {
    onChange(budgeted - available)
  }

  return isVisible ? (
    <>
      <OutlinedInput
        value={budgetedClone}
        margin="dense"
        inputRef={inputRef}
        // formatter={value => formatMoney(value, null, 0)}
        // parser={value => +value.replace(' ', '').replace(',', '.')}
        onChange={onChange}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              onClick={handleClick}
              children={<ArrowDropDownIcon />}
            />
          </InputAdornment>
        }
      />

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
        <MenuItem onClick={resetAvailable}>
          Сбросить остаток в ноль ({formatMoney(budgeted - available)})
        </MenuItem>
      </Menu>
    </>
  ) : (
    <div onClick={showInput}>-</div>
  )
}

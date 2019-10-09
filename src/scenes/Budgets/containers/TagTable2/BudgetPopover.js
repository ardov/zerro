import React from 'react'
import Button from '@material-ui/core/Button'
import {
  Box,
  List,
  ListItem,
  TextField,
  Popover,
  Divider,
} from '@material-ui/core'

export default function BudgetPopover({
  id,
  amount,
  prevAmount,
  onChange,
  ...rest
}) {
  const [value, setValue] = React.useState(amount)

  const handleChange = e => {
    setValue(+e.target.value)
  }

  return (
    <Popover disableRestoreFocus disableAutoFocus disableEnforceFocus {...rest}>
      <Box p={2}>
        <TextField
          value={value}
          variant="outlined"
          fullWidth
          onChange={handleChange}
        />
      </Box>
      <Box p={2} pt={0}>
        {prevAmount !== undefined && prevAmount !== null && (
          <Button
            onClick={() => {
              onChange(prevAmount)
            }}
          >
            Бюджет в прошлом мес ({prevAmount})
          </Button>
        )}
      </Box>
    </Popover>
  )
}

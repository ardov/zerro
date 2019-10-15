import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
  InputAdornment,
  Popover,
  IconButton,
} from '@material-ui/core'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import { formatMoney } from 'helpers/format'

export default function BudgetPopover({
  id,
  budgeted,
  available,
  prevBudgeted,
  prevSpend,
  currency,
  onChange,
  ...rest
}) {
  const [value, setValue] = React.useState(budgeted)

  const handleChange = e => setValue(e.target.value)
  const handleKeyDown = e => (e.keyCode === 13 ? onChange(+value) : false)

  return (
    <Popover disableRestoreFocus onClose={() => onChange(+value)} {...rest}>
      <Box p={2} pb={0}>
        <TextField
          autoFocus
          value={value}
          variant="outlined"
          type="number"
          fullWidth
          onFocus={e => e.target.select()}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          helperText={`Остаток категории ${formatMoney(
            available + +value - budgeted,
            currency
          )}`}
          placeholder="0"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" onClick={() => onChange(+value)}>
                  <CheckCircleIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <List>
        {!!prevBudgeted && (
          <ListItem
            button
            selected={+value === +prevBudgeted}
            onClick={() => onChange(+prevBudgeted)}
          >
            <ListItemText
              primary="Бюджет в прошлом месяце"
              secondary={formatMoney(prevBudgeted, currency)}
            />
          </ListItem>
        )}

        {!!prevSpend && (
          <ListItem
            button
            selected={+value === +prevSpend}
            onClick={() => onChange(+prevSpend)}
          >
            <ListItemText
              primary="Расход в прошлом месяце"
              secondary={formatMoney(prevSpend, currency)}
            />
          </ListItem>
        )}

        {available < 0 && (
          <ListItem
            button
            selected={+value === +prevSpend}
            onClick={() => onChange(+budgeted - available)}
          >
            <ListItemText
              primary="Покрыть перерасход"
              secondary={formatMoney(+budgeted - available, currency)}
            />
          </ListItem>
        )}
      </List>
    </Popover>
  )
}

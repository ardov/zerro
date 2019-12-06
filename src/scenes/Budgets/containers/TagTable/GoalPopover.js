import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Popover,
  IconButton,
  TextField,
  MenuItem,
} from '@material-ui/core'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import { formatMoney } from 'helpers/format'
import AmountInput from 'components/AmountInput'

export default function BudgetPopover({
  currency,
  type = 'monthly',
  amount,
  date,
  onChange,
  ...rest
}) {
  const [value, setValue] = React.useState(amount)
  const [vType, setVType] = React.useState(type)
  const [vDate, setVDate] = React.useState(date)

  const handleTypeChange = e => setVType(e.target.value)
  const save = () => onChange({ type: vType, amount: value, date: vDate })

  return (
    <Popover disableRestoreFocus onClose={save} {...rest}>
      <Box p={2} pb={0}>
        <TextField
          select
          variant="outlined"
          value={vType}
          onChange={handleTypeChange}
          label="Хочу"
          fullWidth
        >
          <MenuItem value="monthly">Откладывать каждый месяц</MenuItem>
          <MenuItem value="target">Накопить сумму</MenuItem>
          <MenuItem value="targetByDate">Накопить сумму до...</MenuItem>
        </TextField>
      </Box>

      <Box p={2} pb={0}>
        <AmountInput
          autoFocus
          value={value}
          fullWidth
          onChange={value => setValue(+value)}
          onEnter={value => {
            setValue(+value)
            save()
          }}
          helperText={`Остаток категории ${formatMoney(10000, currency)}`}
          placeholder="0"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" onClick={save}>
                  <CheckCircleIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <List>
        {/* {!!prevBudgeted && (
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
        )} */}
      </List>
    </Popover>
  )
}

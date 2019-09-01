import React from 'react'
import Typography from '@material-ui/core/Typography'
import { formatMoney } from 'helpers/format'
import InputBase from '@material-ui/core/InputBase'

export function Budgeted({ value, onChange }) {
  const [showInput, setShowInput] = React.useState(false)

  const setBudget = e => {
    const newValue = +e.target.value || 0
    setShowInput(false)
    if (newValue !== value) {
      onChange(newValue)
    }
  }
  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setBudget(e)
    }
  }
  const setInputVisible = () => setShowInput(true)

  return showInput ? (
    <InputBase
      placeholder="0"
      style={{ textAlign: 'right' }}
      type="number"
      defaultValue={value}
      autoFocus
      onBlur={setBudget}
      onKeyPress={handleKeyPress}
    />
  ) : (
    <Typography
      variant="body1"
      align="right"
      color="inherit"
      onClick={setInputVisible}
    >
      {formatMoney(value)}
    </Typography>
  )
}

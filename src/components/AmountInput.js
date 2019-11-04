import React, { useState, useEffect } from 'react'
import { TextField, InputAdornment } from '@material-ui/core'
import { getCurrencySymbol } from 'helpers/format'

export default function AmountInput({
  currency,
  value,
  onChange,
  label,
  ...rest
}) {
  const [val, setVal] = useState(value || '')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    setVal(value)
  }, [value])

  const sym = currency ? getCurrencySymbol(currency) : null

  const formattedValue =
    new Intl.NumberFormat('ru', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) || ''

  const calc = str => {
    try {
      return eval(str.replace(/[-+*/]*$/g, '').replace(/^[+*/]*/g, ''))
    } catch (error) {
      return value
    }
  }

  const handleChange = e =>
    setVal(e.target.value.replace(/[^0-9,.+\-/*]/g, '').replace(/,/g, '.'))

  const handleBlur = () => {
    setFocused(false)
    onChange(calc(val))
  }
  const handleKeyDown = e => (e.keyCode === 13 ? onChange(calc(val)) : false)

  return (
    <TextField
      value={focused ? val : formattedValue}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      label={label}
      helperText=""
      variant="outlined"
      inputProps={{
        type: 'tel',
      }}
      InputProps={{
        endAdornment: sym && <InputAdornment position="end" children={sym} />,
      }}
      {...rest}
    />
  )
}

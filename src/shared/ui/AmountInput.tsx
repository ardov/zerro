import React, { useState, useEffect, useRef, FC } from 'react'
import {
  TextField,
  InputAdornment,
  TextFieldProps,
  Button,
  Stack,
} from '@mui/material'
import { getCurrencySymbol } from 'shared/helpers/format'
import { Modify } from 'types'

export type AmountInputProps = Modify<
  TextFieldProps,
  {
    value: number
    currency?: string
    selectOnFocus?: boolean
    signButtons?: boolean | 'auto'
    onChange: (n: number) => void
    onEnter?: (n: number) => void
  }
>

export const AmountInput: FC<AmountInputProps> = ({
  value = 0,
  currency,
  selectOnFocus = false,
  signButtons,
  onChange,
  onEnter,
  onBlur,
  onFocus,
  onKeyDown,
  ...rest
}) => {
  const ref = useRef<HTMLInputElement>()
  const [expression, setExpression] = useState(value.toString())
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setExpression(value === 0 ? '' : value.toString())
  }, [value, focused])

  useEffect(() => {
    if (focused && ref && selectOnFocus) ref?.current?.select()
  }, [focused, selectOnFocus])

  const sym = currency ? getCurrencySymbol(currency) : null

  const formattedValue =
    new Intl.NumberFormat('ru', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) || ''

  const calc = (str: string) => {
    try {
      // eslint-disable-next-line no-eval
      let computed = +eval(
        str
          .replace(/^0*(?=0|0.|[1-9])/g, '') // remove leading zeroes
          .replace(/[-+*/]*$/g, '') // trim symbols in the end
          .replace(/^[+*/]*/g, '') // trim symbols at the beginning
      )

      return computed || 0
    } catch (error) {
      return value
    }
  }

  const changeHandler: TextFieldProps['onChange'] = e => {
    const cleaned = e.target.value
      .replace(/[^0-9,.+\-/*]/g, '')
      .replace(/,/g, '.')
    setExpression(cleaned)
    const computed = calc(cleaned)
    if (computed !== value) onChange(computed)
  }
  const focusHandler: TextFieldProps['onFocus'] = e => {
    setFocused(true)
    if (onFocus) onFocus(e)
  }
  const blurHandler: TextFieldProps['onBlur'] = e => {
    setFocused(false)
    if (onBlur) onBlur(e)
  }
  const keyDownHandler: TextFieldProps['onKeyDown'] = e => {
    if (onEnter && e.key === 'Enter') {
      e.preventDefault()
      onEnter(calc(expression))
    }
    if (onKeyDown) onKeyDown(e)
  }

  const Field = (
    <TextField
      value={focused ? expression || '' : formattedValue || ''}
      variant="outlined"
      inputRef={ref}
      inputProps={{ type: 'tel' }}
      InputProps={{
        endAdornment: sym && (
          <InputAdornment position="end" disableTypography children={sym} />
        ),
      }}
      onChange={changeHandler}
      onFocus={focusHandler}
      onBlur={blurHandler}
      onKeyDown={keyDownHandler}
      {...rest}
    />
  )

  if (!signButtons) {
    return Field
  }
  if (signButtons === 'auto' && !iOS()) {
    return Field
  }
  return (
    <div>
      {Field}

      <Stack direction="row" width="100%">
        <Button
          onClick={() => {
            ref.current?.focus()
            setExpression(e => e + '+')
          }}
        >
          +
        </Button>
        <Button
          onClick={() => {
            ref.current?.focus()
            setExpression(e => e + '-')
          }}
        >
          -
        </Button>
        <Button
          onClick={() => {
            ref.current?.focus()
            setExpression(e => e + '*')
          }}
        >
          ×
        </Button>
        <Button
          onClick={() => {
            ref.current?.focus()
            setExpression(e => e + '/')
          }}
        >
          ÷
        </Button>
      </Stack>
    </div>
  )
}

function iOS() {
  return (
    [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod',
    ].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  )
}

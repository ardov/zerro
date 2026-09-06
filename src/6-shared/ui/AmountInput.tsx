import type { FC } from 'react'
import { useState, useEffect, useRef } from 'react'
import { Button } from './Button'
import { OutlinedField, type OutlinedFieldProps } from './OutlinedField'
import {
  amountFromExpression,
  cleanAmountInput,
  getCurrencySymbol,
} from '@/6-shared/helpers/money'
import type { Modify } from '@/6-shared/types'

// `ref` and `type` are owned: the ref drives selectOnFocus and the sign
// buttons, and `tel` is what raises the numeric keypad on mobile.
type TFieldProps = Omit<OutlinedFieldProps, 'ref' | 'type'>

export type AmountInputProps = Modify<
  TFieldProps,
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
  autoFocus,
  endAdornment,
  ...rest
}) => {
  const ref = useRef<HTMLInputElement>(null)
  const [expression, setExpression] = useState(
    value === 0 ? '' : value.toString()
  )
  const [focused, setFocused] = useState(false)

  const [prevValue, setPrevValue] = useState({ value, focused })
  if (prevValue.value !== value || prevValue.focused !== focused) {
    setPrevValue({ value, focused })
    if (!focused) setExpression(value === 0 ? '' : value.toString())
  }

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

  const calc = (str: string) => amountFromExpression(str, value)

  const changeHandler: TFieldProps['onChange'] = e => {
    const cleaned = cleanAmountInput(e.target.value)
    setExpression(cleaned)
    const computed = calc(cleaned)
    if (computed !== value) onChange(computed)
  }
  const focusHandler: TFieldProps['onFocus'] = e => {
    setFocused(true)
    if (onFocus) onFocus(e)
  }
  const blurHandler: TFieldProps['onBlur'] = e => {
    setFocused(false)
    if (onBlur) onBlur(e)
  }
  const keyDownHandler: TFieldProps['onKeyDown'] = e => {
    if (onEnter && e.key === 'Enter') {
      e.preventDefault()
      onEnter(calc(expression))
    }
    if (onKeyDown) onKeyDown(e)
  }

  const Field = (
    <OutlinedField
      value={focused ? expression || '' : formattedValue || ''}
      onChange={changeHandler}
      onFocus={focusHandler}
      onBlur={blurHandler}
      onKeyDown={keyDownHandler}
      autoFocus={autoFocus}
      endAdornment={endAdornment === undefined ? sym : endAdornment}
      {...rest}
      ref={ref}
      type="tel"
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
      <div className="flex w-full">
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
      </div>
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

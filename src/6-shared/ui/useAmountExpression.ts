import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react'
import { useState } from 'react'
import {
  amountFromExpression,
  cleanAmountInput,
} from '@/6-shared/helpers/money'

export type UseAmountExpressionOptions = {
  value: number
  onChange: (value: number) => void
  /** Enter, with whatever the field is worth by then. */
  onEnter?: (value: number) => void
  /** How the amount reads while nobody is typing into it. */
  format: (value: number) => string
  /** Select the whole amount when the field is entered, so the first
   * keystroke replaces it rather than appending to it. */
  selectOnFocus?: boolean
}

/** The two things every amount field does: hold the arithmetic being typed,
 * and report what it is worth on each keystroke.
 *
 * The expression and the value are separate on purpose. `120/2` is worth 60
 * the moment it is complete, and the caller hears about it right away — but
 * the text has to stay `120/2` until focus leaves, or the division would
 * disappear under the person doing it. */
export function useAmountExpression(options: UseAmountExpressionOptions) {
  const { value, onChange, onEnter, format, selectOnFocus = true } = options
  const [expression, setExpression] = useState(() => toExpression(value))
  const [focused, setFocused] = useState(false)

  // A value arriving from outside replaces the text; one this field reported
  // does not, because the text it came from is what is being typed.
  const [prev, setPrev] = useState({ value, focused })
  if (prev.value !== value || prev.focused !== focused) {
    setPrev({ value, focused })
    if (!focused) setExpression(toExpression(value))
  }

  return {
    focused,
    /** Spread onto the input. `tel` is what raises a numeric keypad on a
     * phone while still accepting the operators. */
    inputProps: {
      value: focused ? expression : format(value),
      type: 'tel' as const,
      inputMode: 'decimal' as const,
      autoComplete: 'off' as const,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        const cleaned = cleanAmountInput(event.target.value)
        setExpression(cleaned)
        const computed = amountFromExpression(cleaned, value)
        if (computed !== value) onChange(computed)
      },
      onFocus: (event: FocusEvent<HTMLInputElement>) => {
        setFocused(true)
        if (selectOnFocus) event.currentTarget.select()
      },
      onBlur: () => setFocused(false),
      onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
        if (onEnter && event.key === 'Enter') {
          event.preventDefault()
          onEnter(amountFromExpression(expression, value))
        }
      },
    },
  }
}

/** Nothing rather than a zero: a field showing `0` has to be cleared before
 * it can be filled in. */
function toExpression(value: number): string {
  return value === 0 ? '' : String(value)
}

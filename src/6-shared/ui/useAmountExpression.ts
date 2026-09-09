import type {
  ChangeEvent,
  FocusEvent,
  InputEvent as ReactInputEvent,
  KeyboardEvent,
} from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import {
  amountFromExpression,
  cleanAmountInput,
  formatAmountExpression,
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
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
  onBeforeInput?: (event: ReactInputEvent<HTMLInputElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
}

type LogicalSelection = { start: number; end: number }

type InputIntent = {
  position: number
  collapsed: boolean
  inputType: string
}

/** The two things every amount field does: hold the arithmetic being typed,
 * and report what it is worth on each keystroke.
 *
 * The expression and the value are separate on purpose. `1200/2` is worth 600
 * the moment it is complete, and the caller hears about it right away — but
 * the text stays `1 200/2` until focus leaves. Group separators and the locale
 * decimal comma are only its projection, so they never become separately
 * editable characters. */
export function useAmountExpression(options: UseAmountExpressionOptions) {
  const {
    value,
    onChange,
    onEnter,
    format,
    selectOnFocus = true,
    onFocus,
    onBlur,
    onBeforeInput,
    onKeyDown,
  } = options
  const [expression, setExpression] = useState(() =>
    toExpression(value, format)
  )
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const selection = useRef<LogicalSelection | null>(null)
  const inputIntent = useRef<InputIntent | null>(null)

  // A value arriving from outside replaces the text; one this field reported
  // does not, because the text it came from is what is being typed.
  const [prev, setPrev] = useState({ value, focused })
  if (prev.value !== value || prev.focused !== focused) {
    setPrev({ value, focused })
    if (!focused) setExpression(toExpression(value, format))
  }

  const display = focused ? formatAmountExpression(expression) : format(value)

  // React replaces the input value with the formatted projection after an
  // edit. Put the caret back at the same logical place after that replacement.
  useLayoutEffect(() => {
    const next = selection.current
    const input = inputRef.current
    if (!focused || !next || !input) return
    input.setSelectionRange(
      amountExpressionOffsetToDisplay(input.value, next.start),
      amountExpressionOffsetToDisplay(input.value, next.end)
    )
    selection.current = null
  }, [display, focused])

  const rememberIntent = (input: HTMLInputElement, inputType: string): void => {
    const displayStart = input.selectionStart ?? input.value.length
    const displayEnd = input.selectionEnd ?? displayStart
    inputIntent.current = {
      inputType,
      collapsed: displayStart === displayEnd,
      position: amountExpressionOffsetFromDisplay(input.value, displayStart),
    }
  }

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const changedDisplay = event.currentTarget.value
    let nextExpression = cleanAmountInput(changedDisplay)
    const changedStart =
      event.currentTarget.selectionStart ?? changedDisplay.length
    const changedEnd = event.currentTarget.selectionEnd ?? changedStart
    let nextSelection: LogicalSelection = {
      start: amountExpressionOffsetFromDisplay(changedDisplay, changedStart),
      end: amountExpressionOffsetFromDisplay(changedDisplay, changedEnd),
    }

    // Deleting a generated group separator leaves the cleaned expression
    // unchanged. Treat that intent as deleting the adjacent real character,
    // so Backspace and Delete never appear to get stuck on a space.
    const intent = inputIntent.current
    inputIntent.current = null
    if (nextExpression === expression && intent?.collapsed) {
      if (intent.inputType === 'deleteContentBackward' && intent.position > 0) {
        nextExpression =
          expression.slice(0, intent.position - 1) +
          expression.slice(intent.position)
        nextSelection = {
          start: intent.position - 1,
          end: intent.position - 1,
        }
      } else if (
        intent.inputType === 'deleteContentForward' &&
        intent.position < expression.length
      ) {
        nextExpression =
          expression.slice(0, intent.position) +
          expression.slice(intent.position + 1)
        nextSelection = { start: intent.position, end: intent.position }
      }
    }

    selection.current = nextSelection
    setExpression(nextExpression)
    if (nextExpression === expression) {
      const input = event.currentTarget
      // No state changed, so there is no layout effect to restore selection.
      // React puts the controlled value back before this microtask; run after
      // the native edit too, so a discarded character cannot leave the caret
      // at the end of the field.
      queueMicrotask(() => {
        if (inputRef.current !== input || document.activeElement !== input)
          return
        input.setSelectionRange(
          amountExpressionOffsetToDisplay(input.value, nextSelection.start),
          amountExpressionOffsetToDisplay(input.value, nextSelection.end)
        )
        selection.current = null
      })
    }
    const computed = amountFromExpression(nextExpression, value)
    if (computed !== value) onChange(computed)
  }

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      rememberIntent(event.currentTarget, 'deleteContentBackward')
    } else if (event.key === 'Delete') {
      rememberIntent(event.currentTarget, 'deleteContentForward')
    }

    if (onEnter && event.key === 'Enter') {
      event.preventDefault()
      onEnter(amountFromExpression(expression, value))
    }
    onKeyDown?.(event)
  }

  return {
    appendOperator(operator: '+' | '-' | '*' | '/') {
      inputRef.current?.focus()
      selection.current = {
        start: expression.length + 1,
        end: expression.length + 1,
      }
      setExpression(current => current + operator)
    },
    /** Spread onto the input. `tel` is what raises a numeric keypad on a
     * phone while still accepting the operators. */
    inputProps: {
      ref: inputRef,
      value: display,
      type: 'tel' as const,
      inputMode: 'decimal' as const,
      autoComplete: 'off' as const,
      onBeforeInput: (event: ReactInputEvent<HTMLInputElement>) => {
        const nativeEvent = event.nativeEvent as globalThis.InputEvent
        rememberIntent(event.currentTarget, nativeEvent.inputType)
        onBeforeInput?.(event)
        // If none of the inserted text belongs to the amount grammar, leave
        // the native value and selection untouched. Let mixed input through:
        // `12x` still inserts `12`, with the normal change path restoring its
        // logical caret after the `x` is discarded.
        if (
          !event.defaultPrevented &&
          event.data &&
          cleanAmountInput(event.data) === ''
        ) {
          event.preventDefault()
        }
      },
      onChange: change,
      onFocus: (event: FocusEvent<HTMLInputElement>) => {
        setFocused(true)
        if (selectOnFocus) {
          selection.current = { start: 0, end: expression.length }
          event.currentTarget.select()
        }
        onFocus?.(event)
      },
      onBlur: (event: FocusEvent<HTMLInputElement>) => {
        selection.current = null
        inputIntent.current = null
        setFocused(false)
        onBlur?.(event)
      },
      onKeyDown: keyDown,
    },
  }
}

/** The formatted resting value supplies the editable precision too: a regular
 * field enters as `3 240,00`, while the headline enters as `3 240`. Zero stays
 * empty while editing, so it is a placeholder rather than text that has to be
 * cleared before a real amount can be entered. */
function toExpression(
  value: number,
  format: (value: number) => string
): string {
  return value === 0 ? '' : cleanAmountInput(format(value))
}

/** Group separators have no editable position of their own. */
function amountExpressionOffsetFromDisplay(
  display: string,
  offset: number
): number {
  return cleanAmountInput(display.slice(0, offset)).length
}

function amountExpressionOffsetToDisplay(
  display: string,
  offset: number
): number {
  if (offset <= 0) return 0

  let logicalOffset = 0
  for (let displayOffset = 0; displayOffset < display.length; displayOffset++) {
    if (cleanAmountInput(display[displayOffset]).length) logicalOffset++
    if (logicalOffset === offset) return displayOffset + 1
  }
  return display.length
}

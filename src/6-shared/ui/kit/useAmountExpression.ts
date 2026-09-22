import type {
  ChangeEvent,
  FocusEvent,
  InputEvent as ReactInputEvent,
  KeyboardEvent,
  SyntheticEvent,
} from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import { cleanAmountInput, formatAmountExpression } from './amountExpression'
import {
  createAmountSession,
  transitionAmountSession,
  type AmountEditingSession,
  type AmountSelection,
} from './amountEditingSession'

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
  const [session, setSession] = useState(() =>
    createAmountSession(value, toExpression(value, format))
  )
  const { expression } = session.current
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const selection = useRef<AmountSelection | null>(null)
  const inputIntent = useRef<InputIntent | null>(null)
  const lastSelection = useRef<AmountSelection | null>(null)
  const scopeFocused = useRef(false)

  // An echo keeps the editable expression and history. An external replacement
  // starts a fresh session, including its undo boundary.
  if (session.received !== value) {
    setSession(
      transitionAmountSession(session, {
        type: 'receive',
        amount: value,
        expression: toExpression(value, format),
      })
    )
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

  const apply = (next: AmountEditingSession) => {
    selection.current = next.current.selection
    lastSelection.current = next.current.selection
    setSession(next)
    if (next.current.amount !== value) onChange(next.current.amount)
  }

  const update = (expression: string, nextSelection: AmountSelection) => {
    apply(
      transitionAmountSession(
        session,
        {
          type: 'edit',
          expression,
          selection: nextSelection,
        },
        lastSelection.current ?? undefined
      )
    )
  }

  const finish = () => {
    const amount = session.current.amount
    apply(
      transitionAmountSession(
        session,
        {
          type: 'finish',
          expression: toExpression(amount, format),
        },
        lastSelection.current ?? undefined
      )
    )
    return amount
  }

  const undo = (redo: boolean) => {
    const next = transitionAmountSession(
      session,
      { type: redo ? 'redo' : 'undo' },
      lastSelection.current ?? undefined
    )
    if (next !== session) apply(next)
  }

  // React's onBeforeInput is synthesized from text/composition events. Native
  // beforeinput is needed for system undo and deletion on mobile keyboards.
  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return
    const beforeInput = (event: globalThis.InputEvent) => {
      if (event.defaultPrevented || input.readOnly || input.disabled) return
      rememberIntent(input, event.inputType)
      if (
        event.inputType === 'historyUndo' ||
        event.inputType === 'historyRedo'
      ) {
        if (!event.cancelable) return
        event.preventDefault()
        undo(event.inputType === 'historyRedo')
      }
    }
    input.addEventListener('beforeinput', beforeInput)
    return () => input.removeEventListener('beforeinput', beforeInput)
  })

  const leave = () => {
    finish()
    selection.current = null
    lastSelection.current = null
    inputIntent.current = null
    setFocused(false)
  }

  const blurWithin = (event: FocusEvent<HTMLElement>) => {
    if (!editorRef.current) {
      leave()
      return
    }
    scopeFocused.current = false
    if (editorRef.current?.contains(event.relatedTarget)) return
    // React focus events also cross portals. Let the next focus capture
    // confirm whether a currency picker still belongs to this editor.
    queueMicrotask(() => {
      if (!scopeFocused.current) leave()
    })
  }

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const changedDisplay = event.currentTarget.value
    let nextExpression = cleanAmountInput(changedDisplay)
    const changedStart =
      event.currentTarget.selectionStart ?? changedDisplay.length
    const changedEnd = event.currentTarget.selectionEnd ?? changedStart
    let nextSelection: AmountSelection = {
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

    update(nextExpression, nextSelection)
    if (nextExpression === expression) {
      const input = event.currentTarget
      // The display did not change, so no layout effect restores selection.
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
  }

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || event.nativeEvent.isComposing) return
    if (
      !event.currentTarget.readOnly &&
      !event.currentTarget.disabled &&
      (event.metaKey || event.ctrlKey) &&
      !event.altKey &&
      ['z', 'y'].includes(event.key.toLowerCase())
    ) {
      event.preventDefault()
      undo(event.shiftKey || event.key.toLowerCase() === 'y')
      return
    }
    if (event.key === 'Backspace') {
      rememberIntent(event.currentTarget, 'deleteContentBackward')
    } else if (event.key === 'Delete') {
      rememberIntent(event.currentTarget, 'deleteContentForward')
    }

    if (event.key === 'Enter') {
      const amount = finish()
      if (onEnter) {
        event.preventDefault()
        onEnter(amount)
      }
    }
  }

  const insert = (text: string, at: AmountSelection) => {
    const input = inputRef.current
    if (!input || input.disabled || input.readOnly) return
    const next = expression.slice(0, at.start) + text + expression.slice(at.end)
    input.focus()
    const offset = at.start + text.length
    update(next, { start: offset, end: offset })
  }

  return {
    appendOperator(operator: '+' | '-' | '*' | '/') {
      insert(operator, { start: expression.length, end: expression.length })
    },
    insertOperator(operator: '+' | '-' | '*' | '/') {
      const input = inputRef.current
      const at =
        input && document.activeElement === input
          ? {
              start: amountExpressionOffsetFromDisplay(
                input.value,
                input.selectionStart ?? input.value.length
              ),
              end: amountExpressionOffsetFromDisplay(
                input.value,
                input.selectionEnd ?? input.value.length
              ),
            }
          : (lastSelection.current ?? {
              start: expression.length,
              end: expression.length,
            })
      insert(operator, at)
    },
    /** Optional wrapper for addons and operator buttons in the same edit session. */
    editorProps: {
      ref: editorRef,
      onBlurCapture: blurWithin,
      onFocusCapture: () => {
        scopeFocused.current = true
      },
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
      onSelect: (event: SyntheticEvent<HTMLInputElement>) => {
        const input = event.currentTarget
        lastSelection.current = {
          start: amountExpressionOffsetFromDisplay(
            input.value,
            input.selectionStart ?? 0
          ),
          end: amountExpressionOffsetFromDisplay(
            input.value,
            input.selectionEnd ?? 0
          ),
        }
      },
      onFocus: (event: FocusEvent<HTMLInputElement>) => {
        setFocused(true)
        if (!focused && selectOnFocus) {
          selection.current = { start: 0, end: expression.length }
          event.currentTarget.select()
        }
        onFocus?.(event)
      },
      onBlur: (event: FocusEvent<HTMLInputElement>) => {
        if (!editorRef.current) blurWithin(event)
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

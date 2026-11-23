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
  onEnter?: (value: number) => void
  onCommit?: (value: number) => void
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

/** Report the evaluated value on edits while retaining the entered expression and its logical caret positions. */
export function useAmountExpression(options: UseAmountExpressionOptions) {
  const {
    value,
    onChange,
    onEnter,
    onCommit,
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
    onCommit?.(amount)
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

    // Deleting a display separator would leave the model unchanged; remove the adjacent editable character instead.
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
      // Without a display change no layout effect restores the caret. Wait for React and the native edit in a microtask.
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
        // Reject an entirely invalid insert without touching the caret. Mixed input goes through normal cleanup.
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

/** Use resting formatting to seed edit precision. Zero opens empty so it does not require a manual clear. */
function toExpression(
  value: number,
  format: (value: number) => string
): string {
  return value === 0 ? '' : cleanAmountInput(format(value))
}

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

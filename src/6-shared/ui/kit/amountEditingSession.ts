import { amountFromExpression } from './amountExpression'

export type AmountSelection = { start: number; end: number }
type Snapshot = {
  expression: string
  amount: number
  selection: AmountSelection
}

export type AmountEditingSession = {
  current: Snapshot
  received: number
  undo: Snapshot[]
  redo: Snapshot[]
}

export function createAmountSession(
  amount: number,
  expression: string
): AmountEditingSession {
  return {
    current: {
      amount,
      expression,
      selection: { start: expression.length, end: expression.length },
    },
    received: amount,
    undo: [],
    redo: [],
  }
}

type Action =
  | { type: 'receive'; amount: number; expression: string }
  | { type: 'edit'; expression: string; selection: AmountSelection }
  | { type: 'finish'; expression: string }
  | { type: 'undo' }
  | { type: 'redo' }

/** Numeric values are computed only by edits. Formatting and finishing must
 * never turn a rounded display back into a new amount. */
export function transitionAmountSession(
  session: AmountEditingSession,
  action: Action,
  selection = session.current.selection
): AmountEditingSession {
  if (action.type === 'receive') {
    return action.amount === session.current.amount
      ? { ...session, received: action.amount }
      : createAmountSession(action.amount, action.expression)
  }

  const current = { ...session.current, selection }
  if (action.type === 'undo' || action.type === 'redo') {
    const opposite = action.type === 'undo' ? 'redo' : 'undo'
    const stack = session[action.type]
    const previous = stack.at(-1)
    if (!previous) return session
    return {
      ...session,
      current: previous,
      [action.type]: stack.slice(0, -1),
      [opposite]: [...session[opposite], current],
    }
  }

  const changed = action.expression !== current.expression
  return {
    ...session,
    current: {
      expression: action.expression,
      amount:
        action.type === 'edit' && changed
          ? amountFromExpression(action.expression, current.amount)
          : current.amount,
      selection:
        action.type === 'edit'
          ? action.selection
          : { start: action.expression.length, end: action.expression.length },
    },
    undo: changed ? [...session.undo, current] : session.undo,
    redo: changed ? [] : session.redo,
  }
}

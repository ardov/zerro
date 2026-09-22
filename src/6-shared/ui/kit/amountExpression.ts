import { round } from '@/6-shared/helpers/money/currencyHelpers'
import {
  groupMoneyInteger,
  moneyDecimalSeparator,
} from '@/6-shared/helpers/money/format'

/** The arithmetic an amount field accepts.
 *
 * Amount fields let a sum be worked out in place — `1200/3`, `450+80` — so
 * nobody has to leave the form to add up a bill. The grammar is deliberately
 * the four operators: no functions, percentages or
 * identifiers. That is what makes evaluating it a small parser rather than
 * anything that has to be sandboxed.
 */

/** Reduces typed text to the characters the grammar has. Commas become
 * points, so a decimal typed either way is the same number. */
export function cleanAmountInput(text: string): string {
  return text
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[^0-9,.+\-/*]/g, '')
    .replace(/,/g, '.')
}

/** Formats every number in an expression without evaluating it.
 *
 * The expression remains the editable source of truth. Group separators are
 * only a projection of its integer runs, and a decimal point is shown as the
 * locale comma. That preserves half-typed values such as `12.` and arithmetic
 * such as `12000/3`, neither of which can make a round trip through `number`. */
export function formatAmountExpression(text: string): string {
  return text.replace(/\d+(?:\.\d*)?|\.\d+/g, token => {
    const decimal = token.indexOf('.')
    const integer = decimal === -1 ? token : token.slice(0, decimal)
    const fraction = decimal === -1 ? null : token.slice(decimal + 1)
    const grouped = groupMoneyInteger(integer)
    return fraction === null
      ? grouped
      : `${grouped}${moneyDecimalSeparator}${fraction}`
  })
}

/** What the expression is worth, or `fallback` when it is not one.
 *
 * Half-typed input is ordinary here — every keystroke is evaluated, and
 * `12+` is a state on the way to `12+5`. Leading zeroes and a trailing or
 * leading operator are trimmed rather than refused, so the amount follows
 * along instead of falling back to the last whole one.
 *
 * The result is rounded to two decimals. A division is the obvious reason —
 * splitting 1200 three ways is a number, splitting it seven ways is not a
 * sum of money — but so is addition: `0.1 + 0.2` is not 0.3 in binary
 * floating point, and without this an amount nobody could type would be the
 * one that ends up in the transaction. Only the answer is rounded, rather
 * than rounding at every operator. Invalid and non-finite results keep the
 * last amount; callers never need a separate calculation-error state. */
export function amountFromExpression(text: string, fallback: number): number {
  try {
    const computed = evalExpression(
      text.replace(/[-+*/]*$/g, '').replace(/^[+*/]*/g, '')
    )
    return Number.isFinite(computed) ? round(computed) || 0 : fallback
  } catch {
    return fallback
  }
}

/** Evaluates numbers and + - * /. Throws on invalid input.
 * Private: `amountFromExpression` is the contract, and it is the one that
 * knows what a half-typed expression is worth. */
function evalExpression(source: string): number {
  if (source === '' || source === '.') return 0
  const tokens = source.match(/\d+(?:\.\d*)?|\.\d+|[+\-*/]/g) || []
  if (tokens.join('') !== source) throw new Error('Invalid expression')
  let pos = 0
  const parseFactor = (): number => {
    let sign = 1
    while (tokens[pos] === '+' || tokens[pos] === '-') {
      if (tokens[pos] === '-') sign = -sign
      pos++
    }
    const token = tokens[pos++]
    if (!token || !/^[\d.]/.test(token)) {
      throw new Error('Expected a number')
    }
    return finite(sign * Number(token))
  }
  const parseTerm = (): number => {
    let result = parseFactor()
    while (tokens[pos] === '*' || tokens[pos] === '/') {
      const op = tokens[pos++]
      const rhs = parseFactor()
      result = finite(op === '*' ? result * rhs : result / rhs)
    }
    return result
  }
  const parseSum = (): number => {
    let result = parseTerm()
    while (tokens[pos] === '+' || tokens[pos] === '-') {
      const op = tokens[pos++]
      const rhs = parseTerm()
      result = finite(op === '+' ? result + rhs : result - rhs)
    }
    return result
  }
  const result = parseSum()
  if (pos !== tokens.length) {
    throw new Error('Invalid expression: ' + source)
  }
  return result
}

function finite(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Non-finite amount')
  return value
}

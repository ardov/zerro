import { round } from './currencyHelpers'

/** The arithmetic an amount field accepts.
 *
 * Amount fields let a sum be worked out in place — `1200/3`, `450+80` — so
 * nobody has to leave the form to add up a bill. The grammar is deliberately
 * the four operators and nothing else: no parentheses, no functions, no
 * identifiers. That is what makes evaluating it a small parser rather than
 * anything that has to be sandboxed.
 */

/** Reduces typed text to the characters the grammar has. Commas become
 * points, so a decimal typed either way is the same number. */
export function cleanAmountInput(text: string): string {
  return text.replace(/[^0-9,.+\-/*]/g, '').replace(/,/g, '.')
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
 * one that ends up in the transaction. Only the answer is rounded; the
 * evaluation stays exact, so the rounding happens once rather than at every
 * operator. */
export function amountFromExpression(text: string, fallback: number): number {
  try {
    const computed = evalExpression(
      text
        .replace(/^0*(?=0|0.|[1-9])/g, '')
        .replace(/[-+*/]*$/g, '')
        .replace(/^[+*/]*/g, '')
    )
    return round(computed) || 0
  } catch {
    return fallback
  }
}

/** Evaluates expressions with numbers and + - * / (the only characters the
 * input allows). Returns NaN for an empty string, throws on invalid input.
 * Private: `amountFromExpression` is the contract, and it is the one that
 * knows what a half-typed expression is worth. */
function evalExpression(source: string): number {
  const tokens = source.match(/\d*\.?\d+|[+\-*/]/g) || []
  if (!tokens.length) return NaN
  let pos = 0
  const parseFactor = (): number => {
    let sign = 1
    while (tokens[pos] === '+' || tokens[pos] === '-') {
      if (tokens[pos] === '-') sign = -sign
      pos++
    }
    return sign * Number(tokens[pos++])
  }
  const parseTerm = (): number => {
    let result = parseFactor()
    while (tokens[pos] === '*' || tokens[pos] === '/') {
      const op = tokens[pos++]
      const rhs = parseFactor()
      result = op === '*' ? result * rhs : result / rhs
    }
    return result
  }
  let result = parseTerm()
  while (tokens[pos] === '+' || tokens[pos] === '-') {
    const op = tokens[pos++]
    const rhs = parseTerm()
    result = op === '+' ? result + rhs : result - rhs
  }
  if (pos !== tokens.length || Number.isNaN(result)) {
    throw new Error('Invalid expression: ' + source)
  }
  return result
}

import { round } from '@/6-shared/helpers/money/currencyHelpers'
import {
  groupMoneyInteger,
  moneyDecimalSeparator,
} from '@/6-shared/helpers/money/format'

/** The arithmetic grammar accepts only numbers and the four operators; evaluation uses a dedicated parser. */

export function cleanAmountInput(text: string): string {
  return text
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[^0-9,.+\-/*]/g, '')
    .replace(/,/g, '.')
}

/** Format editable operands without evaluating them, so partial decimals and operators survive. */
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

/** Evaluate partial input, round only the final result, and preserve the last valid amount on parse or overflow errors. */
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

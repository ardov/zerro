import { describe, expect, it } from 'vitest'
import { amountFromExpression, cleanAmountInput } from './expression'

/** What the amount fields were doing before this moved out of one of them.
 * Every case here is reachable by typing into a field, which is why
 * half-finished input has as much of the file as finished input does. */

describe('cleanAmountInput', () => {
  it('keeps digits, separators and the four operators', () => {
    expect(cleanAmountInput('12.5+3*2-1/4')).toBe('12.5+3*2-1/4')
  })

  it('reads a comma as a decimal point, whichever way it was typed', () => {
    expect(cleanAmountInput('25,5')).toBe('25.5')
  })

  it('drops everything the grammar has no room for', () => {
    expect(cleanAmountInput('1 000 ₽')).toBe('1000')
    expect(cleanAmountInput('(2+3)')).toBe('2+3')
  })
})

describe('amountFromExpression', () => {
  it('is worth the number it is', () => {
    expect(amountFromExpression('450', 0)).toBe(450)
    expect(amountFromExpression('12.5', 0)).toBe(12.5)
    expect(amountFromExpression('-12', 0)).toBe(-12)
  })

  it('multiplies and divides before it adds', () => {
    expect(amountFromExpression('45+5*2', 0)).toBe(55)
    expect(amountFromExpression('1200/3', 0)).toBe(400)
    expect(amountFromExpression('2+3-1', 0)).toBe(4)
  })

  it('follows an expression that is only half typed', () => {
    // The operator is there because the second operand is coming.
    expect(amountFromExpression('12+', 7)).toBe(12)
    expect(amountFromExpression('12*', 7)).toBe(12)
    // A leading operator is a keystroke, not an operation.
    expect(amountFromExpression('+12', 7)).toBe(12)
  })

  it('reads leading zeroes as the number under them', () => {
    expect(amountFromExpression('007', 0)).toBe(7)
  })

  it('is worth nothing when it holds no number at all', () => {
    expect(amountFromExpression('', 7)).toBe(0)
    // A separator on its own is a field being cleared, not a broken sum.
    expect(amountFromExpression('.', 7)).toBe(0)
  })

  it('keeps the last whole amount when the numbers do not parse', () => {
    expect(amountFromExpression('1..2', 7)).toBe(7)
  })

  it('is worth a sum of money rather than a number', () => {
    // A division that does not come out evenly.
    expect(amountFromExpression('1200/7', 0)).toBe(171.43)
    // And the one every binary float does: 0.1 + 0.2 is not 0.3.
    expect(amountFromExpression('0.1+0.2', 0)).toBe(0.3)
    // Typing past the second decimal rounds; the field still shows the text.
    expect(amountFromExpression('12.345', 0)).toBe(12.35)
    expect(amountFromExpression('99.999', 0)).toBe(100)
  })

  it('rounds the answer once, not every operator', () => {
    // Rounded at every operator this would be 0.33; the whole sum is 0.335.
    expect(amountFromExpression('0.111+0.112+0.112', 0)).toBe(0.34)
  })
})

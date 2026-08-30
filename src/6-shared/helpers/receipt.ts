import type { TDateDraft } from '6-shared/types'
import { isValidDate, parseDate } from './date'

interface TReceipt {
  /** Timestamp */
  t: Date
  /** Amount */
  s: number
  /**  */
  fn: string
  /** Receipt number */
  i: string
  /**  */
  fp: string
  /** Type of transaction */
  n: string
}

// Receipt string looks like this
// t=20211028T1636&s=1299.00&fn=9287440301110113&i=19313&fp=1992968429&n=1

/** Parses receipt string */
export function parseReceipt(string: string): TReceipt | null {
  try {
    return parseReceiptUnsafe(string)
  } catch (e) {
    console.error('Error parsing receipt', e)
    console.error('Receipt:', string)
    return null
  }
}

function stringToObject(str: string) {
  return str.split('&').reduce(
    (acc, str) => {
      const [key, val] = str.split('=')
      if (key && val) acc[key] = val
      return acc
    },
    {} as Record<string, string>
  )
}

function parseReceiptUnsafe(string: string): TReceipt {
  const obj = stringToObject(string)
  const date = parseDate(obj.t as TDateDraft)
  if (!isValidDate(date) || isNaN(+obj.s)) {
    throw new Error('Unknown receipt format')
  }
  return {
    t: date,
    s: +obj.s || 0,
    fn: obj.fn || '',
    i: obj.i || '',
    fp: obj.fp || '',
    n: obj.n || '',
  } as TReceipt
}

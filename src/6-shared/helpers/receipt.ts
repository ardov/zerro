import { TDateDraft } from '6-shared/types'
import { parseDate } from './date'

interface TReciept {
  /** Timestamp */
  t: Date
  /** Amount */
  s: number
  /**  */
  fn: string
  /** Reciept number */
  i: string
  /**  */
  fp: string
  /** Type of transaction */
  n: string
}

// Reciept string looks like this
// t=20211028T1636&s=1299.00&fn=9287440301110113&i=19313&fp=1992968429&n=1

/** Parses reciept string */
export function parseReceipt(string: string): TReciept | null {
  try {
    return parseReceiptUnsafe(string)
  } catch (e) {
    console.error('Error parsing reciept', e)
    console.error('Reciept:', string)
    return null
  }
}

function stringToObject(str: string) {
  return str.split('&').reduce((acc, str) => {
    const [key, val] = str.split('=')
    if (key && val) acc[key] = val
    return acc
  }, {} as Record<string, string>)
}

function parseReceiptUnsafe(string: string): TReciept {
  let obj = stringToObject(string)
  return {
    t: parseDate(obj.t as TDateDraft),
    s: +obj.s || 0,
    fn: obj.fn || '',
    i: obj.i || '',
    fp: obj.fp || '',
    n: obj.n || '',
  } as TReciept
}

import { TDateDraft } from '@shared/types'
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
export function parseReceipt(string: string): TReciept {
  return string.split('&').reduce((reciept, str) => {
    const [key, val] = str.split('=')
    switch (key) {
      case 't':
        reciept[key] = parseDate(val as TDateDraft)
        break
      case 's':
        reciept[key] = +val
        break
      case 'fn':
      case 'i':
      case 'fp':
      case 'n':
        reciept[key] = val
        break
      default:
        console.warn('Unknown parameter ' + key + ' in reciept: ' + string)
        break
    }
    return reciept
  }, {} as TReciept)
}

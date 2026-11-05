import { describe, expect, test } from 'vitest'
import { enGB } from 'date-fns/locale/en-GB'
import { ru } from 'date-fns/locale/ru'
import {
  dateInputPlaceholder,
  formatDateInput,
  parseDateInput,
} from './dateInput'

describe('date input', () => {
  test('writes the date the way the locale does', () => {
    expect(formatDateInput('2026-08-15', enGB)).toBe('15/08/2026')
    expect(formatDateInput('2026-08-15', ru)).toBe('15.08.2026')
  })

  test('spells the pattern out rather than stating it', () => {
    expect(dateInputPlaceholder(enGB)).toBe('dd/mm/yyyy')
    expect(dateInputPlaceholder(ru)).toBe('dd.mm.yyyy')
  })

  test('reads back what it wrote', () => {
    expect(parseDateInput('15/08/2026', enGB)).toBe('2026-08-15')
    expect(parseDateInput('15.08.2026', ru)).toBe('2026-08-15')
  })

  test('is looser than the pattern it prints', () => {
    // Single digits, a two-digit year, and whatever separates them.
    expect(parseDateInput('3/9/27', enGB)).toBe('2027-09-03')
    expect(parseDateInput('3-9-2027', enGB)).toBe('2027-09-03')
    expect(parseDateInput(' 03 09 2027 ', enGB)).toBe('2027-09-03')
  })

  test('reads the numbers in the order the locale writes them', () => {
    // The same three numbers, and the American order is not this one: a
    // locale added later needs no entry anywhere for this to hold.
    const month = { ...enGB, formatLong: shortDateAs(enGB, 'MM/dd/yyyy') }
    expect(parseDateInput('09/03/2027', month)).toBe('2027-09-03')
    expect(dateInputPlaceholder(month)).toBe('mm/dd/yyyy')
  })

  test('refuses a date the calendar cannot land on', () => {
    // Not the 1st of October, which is where constructing it would land.
    expect(parseDateInput('31/09/2026', enGB)).toBe(null)
    expect(parseDateInput('29/02/2027', enGB)).toBe(null)
    expect(parseDateInput('29/02/2028', enGB)).toBe('2028-02-29')
    expect(parseDateInput('00/09/2026', enGB)).toBe(null)
    expect(parseDateInput('15/13/2026', enGB)).toBe(null)
  })

  test('refuses a year that is not four digits wide', () => {
    // `202` is what every keystroke of `2026` passes through, and `toISODate`
    // would write it back unpadded as `202-08-15` — a string `parseISO` reads
    // as an invalid date and `format` throws on.
    expect(parseDateInput('15/08/202', enGB)).toBe(null)
    expect(parseDateInput('15/08/0000', enGB)).toBe(null)
    expect(parseDateInput('15/08/12345', enGB)).toBe(null)
    expect(parseDateInput('15/08/1000', enGB)).toBe('1000-08-15')
    expect(parseDateInput('15/08/9999', enGB)).toBe('9999-08-15')
  })

  test('reads two digits as the century they are likeliest to mean', () => {
    // A ledger holds old records and few distant plans, so the split is
    // `strftime`'s rather than always this century's.
    expect(parseDateInput('15/08/26', enGB)).toBe('2026-08-15')
    expect(parseDateInput('15/08/68', enGB)).toBe('2068-08-15')
    expect(parseDateInput('15/08/69', enGB)).toBe('1969-08-15')
    expect(parseDateInput('15/08/99', enGB)).toBe('1999-08-15')
    expect(parseDateInput('15/08/00', enGB)).toBe('2000-08-15')
  })

  test('refuses half a date', () => {
    expect(parseDateInput('', enGB)).toBe(null)
    expect(parseDateInput('15', enGB)).toBe(null)
    expect(parseDateInput('15/08', enGB)).toBe(null)
    expect(parseDateInput('15/08/2026/1', enGB)).toBe(null)
  })
})

function shortDateAs(locale: typeof enGB, pattern: string) {
  return {
    ...locale.formatLong,
    date: (options: Parameters<typeof locale.formatLong.date>[0]) =>
      options.width === 'short' ? pattern : locale.formatLong.date(options),
  } as typeof enGB.formatLong
}

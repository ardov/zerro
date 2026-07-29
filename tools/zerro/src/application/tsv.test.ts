// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { parseFormat, renderResultAsTsv, toTsv } from './tsv'

describe('toTsv', () => {
  it('renders a header row and one row per item', () => {
    const items = [
      { id: 'a', title: 'Cash' },
      { id: 'b', title: 'Card' },
    ]
    expect(toTsv(items)).toBe('id\ttitle\na\tCash\nb\tCard')
  })

  it('serializes nested objects/arrays as compact JSON in their cell', () => {
    const items = [{ name: 'Food', total: { CZK: 100, USD: 5 } }]
    expect(toTsv(items)).toBe('name\ttotal\nFood\t{"CZK":100,"USD":5}')
  })

  it('unions columns across rows with differing keys, leaving missing cells blank', () => {
    const items = [{ a: 1, b: 2 }, { a: 3 }]
    const lines = toTsv(items).split('\n')
    expect(lines[0].split('\t').sort()).toEqual(['a', 'b'])
    const aIndex = lines[0].split('\t').indexOf('a')
    const bIndex = lines[0].split('\t').indexOf('b')
    expect(lines[2].split('\t')[aIndex]).toBe('3')
    expect(lines[2].split('\t')[bIndex]).toBe('')
  })

  it('strips tabs and newlines out of string cells so rows stay aligned', () => {
    const items = [{ comment: 'line one\nline two\twith tab' }]
    expect(toTsv(items)).toBe('comment\nline one line two with tab')
  })

  it('returns an empty string for an empty item list', () => {
    expect(toTsv([])).toBe('')
  })
})

describe('parseFormat', () => {
  it('defaults to json when omitted', () => {
    expect(parseFormat(undefined, 'accounts list')).toBe('json')
  })

  it('accepts json and tsv explicitly', () => {
    expect(parseFormat('json', 'accounts list')).toBe('json')
    expect(parseFormat('tsv', 'accounts list')).toBe('tsv')
  })

  it('rejects anything else', () => {
    expect(() => parseFormat('csv', 'accounts list')).toThrow(
      expect.objectContaining({ code: 'INVALID_INPUT' })
    )
  })
})

describe('renderResultAsTsv', () => {
  it('renders the items array of a successful list result', () => {
    const result = {
      ok: true,
      data: { items: [{ id: '1', title: 'Cash' }], returned: 1 },
    }
    expect(renderResultAsTsv('accounts list', result)).toBe(
      'id\ttitle\n1\tCash'
    )
  })

  it('rejects a failure result', () => {
    const result = { ok: false, error: { code: 'X' } }
    expect(() => renderResultAsTsv('accounts list', result)).toThrow(
      expect.objectContaining({ code: 'INVALID_INPUT' })
    )
  })

  it('rejects a success result whose data has no items array', () => {
    const result = { ok: true, data: { month: '2026-07', totals: {} } }
    expect(() => renderResultAsTsv('month get', result)).toThrow(
      expect.objectContaining({ code: 'INVALID_INPUT' })
    )
  })
})

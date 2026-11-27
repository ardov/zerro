import { expect, it } from 'vitest'
import { searchQueries } from './searchQueries'

it.each([
  ['  Ghjlerns  ', 'продукты', 'ghjlerns'],
  ['  ФЖИ  ', 'a:b', 'фжи'],
])(
  'searches %s as %s while retaining the original query',
  (query, expected, original) => {
    expect(searchQueries(query)).toContain(expected)
    expect(searchQueries(query)[0]).toBe(original)
  }
)

it('leaves empty, numeric, and unsupported characters intact without duplicates', () => {
  expect(searchQueries('  ')).toEqual([''])
  expect(searchQueries('123 € 🥕')).toEqual(['123 € 🥕'])
})

import { expect, it } from 'vitest'
import { searchQueries } from './searchQueries'

it.each([
  ['  Ghjlerns  ', 'продукты'],
  ['  ФЖИ  ', 'a:b'],
])(
  'searches %s as %s while retaining the original query',
  (query, expected) => {
    expect(searchQueries(query)).toContain(expected)
    expect(searchQueries(query)[0]).toBe(query.trim().toLocaleLowerCase())
  }
)

it('leaves empty, numeric, and unsupported characters intact without duplicates', () => {
  expect(searchQueries('  ')).toEqual([''])
  expect(searchQueries('123 € 🥕')).toEqual(['123 € 🥕'])
})

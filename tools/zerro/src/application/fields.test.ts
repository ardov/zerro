// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  applyFieldsProjection,
  findUnmatchedFieldPaths,
  projectResultFields,
} from './fields'

describe('applyFieldsProjection', () => {
  it('projects a scalar top-level field', () => {
    const data = { displayCurrency: 'CZK', groupBy: 'tag' }
    expect(applyFieldsProjection(data, 'groupBy')).toEqual({ groupBy: 'tag' })
  })

  it('keeps pagination fields even when not requested, so cursors stay usable', () => {
    const data = {
      items: [{ name: 'Food' }],
      returned: 1,
      totalCount: 5,
      nextCursor: 'abc',
    }
    expect(applyFieldsProjection(data, 'items.name')).toEqual({
      items: [{ name: 'Food' }],
      returned: 1,
      totalCount: 5,
      nextCursor: 'abc',
    })
  })

  it('maps a single dotted path over an array', () => {
    const data = {
      items: [
        { name: 'Food', id: '1' },
        { name: 'Rent', id: '2' },
      ],
    }
    expect(applyFieldsProjection(data, 'items.name')).toEqual({
      items: [{ name: 'Food' }, { name: 'Rent' }],
    })
  })

  it('merges multiple paths sharing an array prefix into the same per-item objects', () => {
    const data = {
      items: [
        { name: 'Food', self: { budgetByCurrency: { CZK: 100 }, extra: 1 } },
        { name: 'Rent', self: { budgetByCurrency: { CZK: 200 }, extra: 2 } },
      ],
    }
    const result = applyFieldsProjection(
      data,
      'items.name, items.self.budgetByCurrency'
    )
    expect(result).toEqual({
      items: [
        { name: 'Food', self: { budgetByCurrency: { CZK: 100 } } },
        { name: 'Rent', self: { budgetByCurrency: { CZK: 200 } } },
      ],
    })
  })

  it('silently drops unknown paths instead of throwing', () => {
    const data = { items: [{ name: 'Food' }] }
    expect(applyFieldsProjection(data, 'items.bogus,bogusTop')).toEqual({
      items: [{}],
    })
  })

  it('keeps a whole array as-is when the path stops at the array itself', () => {
    const data = { items: [1, 2, 3], other: 'x' }
    expect(applyFieldsProjection(data, 'items')).toEqual({ items: [1, 2, 3] })
  })

  it('returns the original data unchanged when the fields string is empty', () => {
    const data = { a: 1 }
    expect(applyFieldsProjection(data, '  ,  ')).toBe(data)
  })
})

describe('findUnmatchedFieldPaths', () => {
  it('returns nothing when every path matches', () => {
    const data = { items: [{ name: 'Food' }] }
    expect(findUnmatchedFieldPaths(data, 'items.name')).toEqual([])
  })

  it('flags a path that matches nothing anywhere in the data', () => {
    const data = { items: [{ name: 'Food' }] }
    expect(findUnmatchedFieldPaths(data, 'items.bogus,bogusTop')).toEqual([
      'items.bogus',
      'bogusTop',
    ])
  })

  it('does not flag a path crossing an empty array as unmatched', () => {
    const data = { items: [] as unknown[] }
    expect(findUnmatchedFieldPaths(data, 'items.name')).toEqual([])
  })
})

describe('projectResultFields', () => {
  it('projects only the data field of a success envelope', () => {
    const result = {
      schemaVersion: 1,
      ok: true,
      command: 'accounts list',
      effect: 'none',
      meta: { stateRevision: 'abc' },
      data: { items: [{ id: '1', title: 'Cash' }], returned: 1 },
    }
    const projected = projectResultFields(result, 'items.title')
    expect(projected).toMatchObject({
      meta: { stateRevision: 'abc' },
      data: { items: [{ title: 'Cash' }] },
    })
  })

  it('passes failure envelopes through untouched', () => {
    const failureResult = { schemaVersion: 1, ok: false, error: { code: 'X' } }
    expect(projectResultFields(failureResult, 'items.title')).toBe(
      failureResult
    )
  })

  it('passes the result through unchanged when no --fields was given', () => {
    const result = { ok: true, data: { a: 1 } }
    expect(projectResultFields(result, undefined)).toBe(result)
  })

  it('warns about a --fields path that matched nothing, without failing the command', () => {
    const result = {
      ok: true,
      data: { items: [{ id: '1', title: 'Cash' }], returned: 1 },
    }
    const projected = projectResultFields(result, 'items.title,items.bogus')
    expect(projected).toMatchObject({
      data: { items: [{ title: 'Cash' }] },
      warnings: [
        {
          code: 'UNKNOWN_FIELD_PATH',
          entityIds: ['items.bogus'],
        },
      ],
    })
  })

  it('adds no warnings key when every requested path matches', () => {
    const result = {
      ok: true,
      data: { items: [{ id: '1', title: 'Cash' }], returned: 1 },
    }
    const projected = projectResultFields(result, 'items.title')
    expect(projected).not.toHaveProperty('warnings')
  })

  it('appends to warnings a command already carried', () => {
    const result = {
      ok: true,
      data: { items: [{ id: '1' }], returned: 1 },
      warnings: [{ code: 'EXISTING', message: 'pre-existing' }],
    }
    const projected = projectResultFields(result, 'items.bogus') as {
      warnings: unknown[]
    }
    expect(projected.warnings).toHaveLength(2)
    expect(projected.warnings[0]).toMatchObject({ code: 'EXISTING' })
    expect(projected.warnings[1]).toMatchObject({ code: 'UNKNOWN_FIELD_PATH' })
  })
})

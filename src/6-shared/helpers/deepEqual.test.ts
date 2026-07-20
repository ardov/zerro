import { describe, expect, it } from 'vitest'
import { deepEqual } from './deepEqual'

describe('deepEqual', () => {
  it('compares primitives', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual(1, 2)).toBe(false)
    expect(deepEqual('a', 'a')).toBe(true)
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(null, undefined)).toBe(false)
    expect(deepEqual(NaN, NaN)).toBe(true)
    // Diverges from lodash.isEqual, which treats these as equal. As a
    // selector equality function this only ever reports an extra change.
    expect(deepEqual(0, -0)).toBe(false)
  })

  it('does not confuse types', () => {
    expect(deepEqual(1, '1')).toBe(false)
    expect(deepEqual(null, {})).toBe(false)
    expect(deepEqual({}, null)).toBe(false)
    expect(deepEqual([], {})).toBe(false)
    expect(deepEqual({}, [])).toBe(false)
  })

  it('compares arrays element-wise', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(deepEqual([1, 2, 3], [1, 2])).toBe(false)
    expect(deepEqual([1, 2], [2, 1])).toBe(false)
  })

  it('compares objects by own keys', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false)
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false)
  })

  it('distinguishes a missing key from an undefined key', () => {
    expect(deepEqual({ a: undefined }, {})).toBe(false)
    expect(deepEqual({ a: undefined }, { b: undefined })).toBe(false)
  })

  it('recurses through nested structures', () => {
    const structure = () => [
      {
        type: 'group',
        id: 'g1',
        parent: null,
        children: [{ id: 'e1', children: [] }],
      },
    ]
    expect(deepEqual(structure(), structure())).toBe(true)

    const changed = structure()
    changed[0].children[0].id = 'e2'
    expect(deepEqual(structure(), changed)).toBe(false)
  })

  it('matches the render-info shape used by selectors', () => {
    const info = () => ({
      e1: { id: 'e1', showSelf: false, isDefaultVisible: true },
      e2: { id: 'e2', showSelf: true, isDefaultVisible: false },
    })
    expect(deepEqual(info(), info())).toBe(true)

    const changed = info()
    changed.e2.showSelf = false
    expect(deepEqual(info(), changed)).toBe(false)
  })
})

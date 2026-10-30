import { describe, expect, it } from 'vitest'
import { remember, restore, type ScreenMemory } from './screenMemory'

describe('Screen memory', () => {
  it('restores a newer view without changing membership or order', () => {
    const memory = remember(
      {},
      {
        screens: { list: 'new search', details: 'transaction' },
        revisions: { list: 2 },
      }
    )
    const older = { screens: { list: 'old search' }, revisions: { list: 1 } }
    expect(restore(older, memory)).toEqual({
      screens: { list: 'new search' },
      revisions: { list: 2 },
    })
    expect(older.screens.list).toBe('old search')
    expect(restore({}, memory)).toEqual({})
  })

  it('keeps the latest revision after visiting an older entry', () => {
    const memory = remember(
      {},
      { screens: { list: 'new' }, revisions: { list: 3 } }
    )
    expect(
      remember(memory, { screens: { list: 'old' }, revisions: { list: 1 } })
    ).toBe(memory)
    expect(
      remember(memory, { screens: { list: 'same' }, revisions: { list: 3 } })
    ).toBe(memory)
    expect(
      restore({ screens: { list: 'newest' }, revisions: { list: 4 } }, memory)
        .screens
    ).toEqual({ list: 'newest' })
  })

  it('removes an unavailable editor while retaining its owner and children', () => {
    const entry = {
      screens: { owner: 'list', details: 'missing', child: 'next list' },
    }
    const memory: ScreenMemory = { details: { removed: true } }
    expect(restore(entry, memory).screens).toEqual({
      owner: 'list',
      child: 'next list',
    })
    expect(Object.keys(entry.screens)).toEqual(['owner', 'details', 'child'])
    expect(
      remember(memory, {
        screens: { details: 'missing' },
        revisions: { details: 5 },
      })
    ).toBe(memory)
  })

  it('does not cache values that have never been updated', () => {
    const memory: ScreenMemory = {}
    expect(remember(memory, { screens: { list: 'view' } })).toBe(memory)
    expect(
      remember(memory, { screens: { list: 'view' }, revisions: { list: 0 } })
    ).toBe(memory)
  })
})

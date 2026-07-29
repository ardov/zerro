// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { resolveEntityId } from './resolve'

const input = { command: 'test', option: 'accountId', entityLabel: 'Account' }

describe('resolveEntityId', () => {
  const entities = {
    a: { id: 'a', title: 'Raif Лёша savings CZK' },
    b: { id: 'b', title: 'Raif Саша Savings CZK' },
    c: { id: 'c', title: 'Cash USD' },
  }

  it('resolves an exact id as-is', () => {
    expect(resolveEntityId(entities, 'a', input)).toBe('a')
  })

  it('resolves an exact title match', () => {
    expect(resolveEntityId(entities, 'Cash USD', input)).toBe('c')
  })

  it('resolves a case-insensitive title match', () => {
    expect(resolveEntityId(entities, 'cash usd', input)).toBe('c')
  })

  it('throws ENTITY_NOT_FOUND with substring candidates on a miss', () => {
    try {
      resolveEntityId(entities, 'Raif', input)
      expect.unreachable()
    } catch (error) {
      expect(error).toMatchObject({
        code: 'ENTITY_NOT_FOUND',
        details: { accountId: 'Raif' },
      })
      const candidates = (error as { details: { candidates: string[] } })
        .details.candidates
      expect(candidates).toHaveLength(2)
      expect(candidates.join(' ')).toContain('Лёша')
      expect(candidates.join(' ')).toContain('Саша')
    }
  })

  it('throws with an empty candidate list when nothing matches at all', () => {
    try {
      resolveEntityId(entities, 'nonexistent', input)
      expect.unreachable()
    } catch (error) {
      expect(error).toMatchObject({
        code: 'ENTITY_NOT_FOUND',
        details: { candidates: [] },
      })
    }
  })
})

import { describe, expect, it } from 'vitest'

import {
  entityCleanupOrder,
  entityProgressOrder,
  entityReferences,
  entityUpsertOrder,
  entityWriteOrder,
} from './entityGraph'
import { dataEntityKeys, intentEntityKeys } from './store'

describe('entity graph', () => {
  it('writes every entity after the entities it points at', () => {
    entityReferences.forEach(reference => {
      if (reference.to === reference.from) return
      expect(entityWriteOrder.indexOf(reference.to)).toBeLessThan(
        entityWriteOrder.indexOf(reference.from)
      )
    })
  })

  it('covers every entity in every derived and declared order', () => {
    expect([...entityWriteOrder].sort()).toEqual([...dataEntityKeys].sort())
    expect([...entityCleanupOrder].sort()).toEqual([...dataEntityKeys].sort())
    expect([...entityProgressOrder].sort()).toEqual([...dataEntityKeys].sort())
    expect([...entityUpsertOrder].sort()).toEqual([...intentEntityKeys].sort())
  })
})

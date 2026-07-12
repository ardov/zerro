import { describe, expect, it } from 'vitest'

import { makeStore } from '../../testing/zenmoneyTestData'
import type { TNormalizedPatch } from '../../types'
import { materializePatch, materializerVersion } from './materializePatch'

describe('materializePatch', () => {
  it('preserves legacy identity behavior until ZenMoney rules are implemented', () => {
    const intentPatch: TNormalizedPatch = { serverTimestamp: 123 }

    const result = materializePatch(makeStore(), intentPatch)

    expect(result).toEqual({
      intentPatch,
      appliedPatch: intentPatch,
      materializerVersion,
    })
    expect(result.appliedPatch).toBe(intentPatch)
  })
})

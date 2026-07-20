import { describe, expect, it } from 'vitest'

import { hashJson } from 'zerro-core/support/testing/stableJson'
import { makeDemoDiff as makeCoreDemoDiff } from 'zerro-core/demo'
import { makeDemoDiff } from './index'

const demoOptions = {
  now: '2026-04-15T12:00:00.000Z',
  until: '2026-03-31' as const,
  scale: 0.35,
}

describe('demoData compatibility wrapper', () => {
  it('delegates to zerro-core demo generation', () => {
    expect(hashJson(makeDemoDiff(demoOptions))).toBe(
      hashJson(makeCoreDemoDiff(demoOptions))
    )
  })
})

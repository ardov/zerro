import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TNormalizedPatch } from 'core-next'
import reducer, { applyClientPatch, applyServerPatch } from './slice'

const { materializePatchMock } = vi.hoisted(() => ({
  materializePatchMock: vi.fn(),
}))

vi.mock('core-next/materializer', () => ({
  materializePatch: materializePatchMock,
}))

describe('data patch boundaries', () => {
  beforeEach(() => {
    materializePatchMock.mockReset()
  })

  it('materializes local client patches before applying and accumulating them', () => {
    const intentPatch: TNormalizedPatch = { serverTimestamp: 100 }
    const appliedPatch: TNormalizedPatch = { serverTimestamp: 200 }
    let observedServerTimestamp: number | undefined
    let observedIntentPatch: TNormalizedPatch | undefined
    materializePatchMock.mockImplementation((snapshot, intent) => {
      observedServerTimestamp = snapshot.serverTimestamp
      observedIntentPatch = intent
      return { appliedPatch }
    })

    const initial = reducer(undefined, { type: 'test/init' })
    const next = reducer(initial, applyClientPatch(intentPatch))

    expect(materializePatchMock).toHaveBeenCalledOnce()
    expect(observedServerTimestamp).toBe(initial.current.serverTimestamp)
    expect(observedIntentPatch).toBe(intentPatch)
    expect(next.current.serverTimestamp).toBe(200)
    expect(next.diff).toEqual(appliedPatch)
  })

  it('applies canonical server patches without local materialization', () => {
    const initial = reducer(undefined, { type: 'test/init' })
    const next = reducer(initial, applyServerPatch({ serverTimestamp: 300 }))

    expect(materializePatchMock).not.toHaveBeenCalled()
    expect(next.current.serverTimestamp).toBe(300)
  })
})

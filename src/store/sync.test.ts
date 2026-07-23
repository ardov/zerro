import { describe, expect, it } from 'vitest'
import reducer, { syncFinished, syncStarted } from './sync'

describe('sync reducer', () => {
  it('starts pending without discarding the previous result', () => {
    const completed = reducer(
      undefined,
      syncFinished({
        finishedAt: 100,
        isSuccessful: true,
        errorMessage: null,
      })
    )

    expect(reducer(completed, syncStarted())).toEqual({
      status: 'pending',
      lastResult: completed.lastResult,
    })
  })

  it('returns to idle with a bounded result', () => {
    expect(
      reducer(
        undefined,
        syncFinished({
          finishedAt: 100,
          isSuccessful: false,
          errorMessage: 'offline',
        })
      )
    ).toEqual({
      status: 'idle',
      lastResult: {
        finishedAt: 100,
        isSuccessful: false,
        errorMessage: 'offline',
      },
    })
  })
})

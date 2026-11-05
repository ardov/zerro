import { describe, expect, it } from 'vitest'
import reducer, {
  syncDetailsClosed,
  syncDetailsOpened,
  syncFinished,
  syncStarted,
  syncStatusChanged,
  type TSyncStatus,
} from './sync'

const sending: TSyncStatus = {
  kind: 'pushing',
  phase: 'sending',
  rows: [{ key: 'account', confirmed: 0, total: 2 }],
  retryAt: null,
  errorMessage: null,
  errorStatus: null,
}

describe('sync reducer', () => {
  it('starts a pull without discarding the previous result', () => {
    const completed = reducer(
      undefined,
      syncFinished({
        finishedAt: 100,
        isSuccessful: true,
        errorMessage: null,
      })
    )

    expect(reducer(completed, syncStarted())).toEqual({
      status: { kind: 'pulling' },
      lastResult: completed.lastResult,
      detailsOpen: false,
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
      status: { kind: 'idle' },
      detailsOpen: false,
      lastResult: {
        finishedAt: 100,
        isSuccessful: false,
        errorMessage: 'offline',
      },
    })
  })

  it('opens and closes details without changing the active push', () => {
    const active = reducer(
      undefined,
      syncStatusChanged({ status: sending, openDetails: false })
    )

    const opened = reducer(active, syncDetailsOpened())
    const closed = reducer(opened, syncDetailsClosed())

    expect(opened).toMatchObject({
      status: { kind: 'pushing', phase: 'sending' },
      detailsOpen: true,
    })
    expect(closed).toEqual(active)
    // A run large enough to want them opens them itself.
    expect(
      reducer(
        undefined,
        syncStatusChanged({ status: sending, openDetails: true })
      )
    ).toMatchObject({ detailsOpen: true })
  })
})

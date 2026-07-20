import { describe, expect, it, vi } from 'vitest'

const { getLocalDataMock, getReplicaStateMock } = vi.hoisted(() => ({
  getLocalDataMock: vi.fn(),
  getReplicaStateMock: vi.fn(),
}))

vi.mock('6-shared/api/localStore', () => ({
  getLocalData: getLocalDataMock,
  getReplicaState: getReplicaStateMock,
  clearStorage: vi.fn(),
  saveLocalData: vi.fn(),
}))

import { makeAccount } from 'zerro-core/support/testing/zenmoneyTestData'
import { getPendingSyncDiff } from 'store/data'
import reducer from 'store/data/slice'
import { loadLocalData } from './localData'

describe('loadLocalData', () => {
  it('restores pending entries over the matching persisted server base', async () => {
    const baseAccount = makeAccount({ id: 'cash', title: 'Cash' })
    const pendingAccount = makeAccount({ id: 'cash', title: 'Wallet' })
    getLocalDataMock.mockResolvedValue({
      serverTimestamp: 100,
      account: [baseAccount],
    })
    getReplicaStateMock.mockResolvedValue({
      version: 3,
      baseServerTimestamp: 100,
      outbox: [
        {
          type: 'patch',
          patch: { account: [pendingAccount] },
          issuedAt: 10,
        },
      ],
    })

    let dataState = reducer(undefined, { type: 'test/init' })
    const dispatch: any = (action: any) => {
      if (typeof action === 'function') {
        return action(dispatch, () => ({ data: dataState }), undefined)
      }
      dataState = reducer(dataState, action)
      return action
    }

    await loadLocalData()(
      dispatch,
      () => ({ data: dataState }) as any,
      undefined
    )

    expect(dataState.base?.account.cash.title).toBe('Cash')
    expect(dataState.current.account.cash.title).toBe('Wallet')
    expect(
      getPendingSyncDiff({ data: dataState } as any)?.account?.[0].title
    ).toBe('Wallet')
    expect(dataState.outbox).toEqual([
      { type: 'patch', patch: { account: [pendingAccount] }, issuedAt: 10 },
    ])
  })

  it('ignores corrupt replica storage without blocking canonical data', async () => {
    getLocalDataMock.mockResolvedValue({ serverTimestamp: 100 })
    getReplicaStateMock.mockResolvedValue({
      version: 3,
      baseServerTimestamp: 100,
      outbox: [{ id: 'broken' }],
    })

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    let dataState = reducer(undefined, { type: 'test/init' })
    const dispatch: any = (action: any) => {
      if (typeof action === 'function') {
        return action(dispatch, () => ({ data: dataState }), undefined)
      }
      dataState = reducer(dataState, action)
      return action
    }

    await loadLocalData()(
      dispatch,
      () => ({ data: dataState }) as any,
      undefined
    )

    expect(dataState.base.serverTimestamp).toBe(100)
    expect(dataState.outbox).toEqual([])
    expect(warn).toHaveBeenCalledWith(
      'Ignoring invalid persisted Core replica',
      expect.any(Error)
    )
    warn.mockRestore()
  })
})

import { describe, expect, it, vi } from 'vitest'

const { getLocalDataMock, getReplicaStateMock } = vi.hoisted(() => ({
  getLocalDataMock: vi.fn(),
  getReplicaStateMock: vi.fn(),
}))

vi.mock('worker', () => ({
  getLocalData: getLocalDataMock,
  getReplicaState: getReplicaStateMock,
  clearStorage: vi.fn(),
  saveLocalData: vi.fn(),
}))

import { makeAccount } from 'zerro-core/testing/zenmoneyTestData'
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
      version: 1,
      baseServerTimestamp: 100,
      outbox: [
        {
          id: 'entry-1',
          command: { type: 'account.rename', title: 'Wallet' },
          intentPatch: { account: [pendingAccount] },
          appliedPatch: { account: [pendingAccount] },
          materializerVersion: 1,
          createdAt: 10,
        },
      ],
      outboxHead: 1,
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
    expect(dataState.outbox?.map(entry => entry.id)).toEqual(['entry-1'])
  })

  it('rejects corrupt replica storage before replay', async () => {
    getLocalDataMock.mockResolvedValue({ serverTimestamp: 100 })
    getReplicaStateMock.mockResolvedValue({
      version: 1,
      baseServerTimestamp: 100,
      outbox: [{ id: 'broken' }],
      outboxHead: 1,
    })

    const dispatch = vi.fn()
    await expect(
      loadLocalData()(dispatch, () => ({}) as any, undefined)
    ).rejects.toThrow('outbox[0] metadata is invalid')
    expect(dispatch).toHaveBeenCalledTimes(1)
  })
})

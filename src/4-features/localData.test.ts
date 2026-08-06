import { describe, expect, it, vi } from 'vitest'

const { getJournalStateMock, getLocalDataMock, getReplicaStateMock } =
  vi.hoisted(() => ({
    getJournalStateMock: vi.fn(),
    getLocalDataMock: vi.fn(),
    getReplicaStateMock: vi.fn(),
  }))

vi.mock('6-shared/api/localStore', () => ({
  getLocalData: getLocalDataMock,
  getJournalState: getJournalStateMock,
  getReplicaState: getReplicaStateMock,
  clearStorage: vi.fn(),
  saveLocalData: vi.fn(),
}))

import {
  makeAccount,
  makeStore,
} from 'zerro-core/support/testing/zenmoneyTestData'
import { journalPersistenceVersion } from 'zerro-core/replica'
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

  it('restores the accepted base from the persisted journal before outbox', async () => {
    const rawAccount = makeAccount({ id: 'cash', title: 'Raw cache' })
    const checkpoint = makeStore({
      serverTimestamp: 100,
      account: { cash: rawAccount },
    })
    getLocalDataMock.mockResolvedValue({
      serverTimestamp: 100,
      account: [rawAccount],
    })
    getJournalStateMock.mockResolvedValue({
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [
        {
          id: 'main',
          checkpoint,
          checkpointValidation: { kind: 'unknown' },
          serverTimestamp: 101,
          points: [
            {
              id: 'server:101',
              transition: {
                serverTimestamp: 101,
                upsert: {
                  account: [{ id: 'cash', fields: { title: 'Accepted' } }],
                },
              },
              validation: { kind: 'unknown' },
              pushed: true,
            },
          ],
        },
      ],
    })
    getReplicaStateMock.mockResolvedValue({
      version: 3,
      baseServerTimestamp: 101,
      outbox: [],
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

    expect(dataState.base.serverTimestamp).toBe(101)
    expect(dataState.base.account.cash.title).toBe('Accepted')
    expect(dataState.journal?.branches[0].points).toHaveLength(1)
  })

  it('surfaces the parser reason when persisted journal storage is malformed', async () => {
    getLocalDataMock.mockResolvedValue({ serverTimestamp: 100 })
    getJournalStateMock.mockResolvedValue({
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [],
    })
    getReplicaStateMock.mockResolvedValue(undefined)

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

    expect(dataState.journalRecoveryRequired).toBe(true)
    expect(dataState.journalRecoveryReason).toContain(
      'branches must be non-empty'
    )
    expect(warn).toHaveBeenCalledWith(
      '[journal-recovery]',
      expect.objectContaining({
        source: 'persisted-journal-parser',
        reason: expect.stringContaining('branches must be non-empty'),
      })
    )
    warn.mockRestore()
  })
})

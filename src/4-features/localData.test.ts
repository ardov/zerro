import { beforeEach, describe, expect, it, vi } from 'vitest'

const { storageMock } = vi.hoisted(() => ({
  storageMock: {
    loadCurrent: vi.fn(),
    loadOutboxForRecovery: vi.fn(),
    compactOneBatch: vi.fn().mockResolvedValue({ entriesDeleted: 0 }),
    saveOutbox: vi.fn().mockResolvedValue(undefined),
    discardOutbox: vi.fn().mockResolvedValue(undefined),
    commitCanonical: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/6-shared/api/replicaStorage', () => ({
  replicaStorage: storageMock,
}))

import {
  makeAccount,
  makeInstrument,
  makeStore,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { AccountType } from '@/6-shared/types'
import reducer, {
  hydrateRecoveryOutbox,
  rebaseServerInbox,
  receiveServerPatch,
} from '@/store/data/slice'
import { discardCorruptOutbox, loadLocalData } from './localData'

beforeEach(() => vi.clearAllMocks())

describe('loadLocalData', () => {
  it('hydrates the reconstructed base and replays its outbox', async () => {
    const base = makeStore({
      serverTimestamp: 100,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    const outbox = [
      {
        type: 'patch' as const,
        patch: { account: [makeAccount({ id: 'cash', title: 'Wallet' })] },
        issuedAt: 10,
      },
    ]
    storageMock.loadCurrent.mockResolvedValue({
      rootUserId: 7,
      base,
      outbox: { status: 'ready', commands: outbox },
    })
    let dataState = reducer(undefined, { type: 'test/init' })
    const dispatch: any = (action: any) => {
      if (typeof action === 'function') {
        return action(dispatch, () => ({ data: dataState }), undefined)
      }
      dataState = reducer(dataState, action)
      return action
    }

    await dispatch(loadLocalData())

    expect(dataState.base).toBe(base)
    expect(dataState.current.account.cash.title).toBe('Wallet')
    expect(dataState.outbox).toEqual(outbox)
    expect(storageMock.compactOneBatch).toHaveBeenCalledOnce()
  })

  it('leaves Redux empty when the new database has no replica', async () => {
    storageMock.loadCurrent.mockResolvedValue(null)
    let dataState = reducer(undefined, { type: 'test/init' })
    const dispatch: any = (action: any) => {
      if (typeof action === 'function') {
        return action(dispatch, () => ({ data: dataState }), undefined)
      }
      dataState = reducer(dataState, action)
      return action
    }

    await dispatch(loadLocalData())

    expect(dataState.rootUserId).toBeNull()
    expect(dataState.base.serverTimestamp).toBe(0)
  })

  it('hydrates canonical state without guessing a corrupt outbox', async () => {
    const base = makeStore({
      serverTimestamp: 100,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    storageMock.loadCurrent.mockResolvedValue({
      rootUserId: 7,
      base,
      outbox: { status: 'corrupt', reason: 'outbox[0] is invalid' },
    })
    let dataState = reducer(undefined, { type: 'test/init' })
    const dispatch: any = (action: any) => {
      if (typeof action === 'function') {
        return action(dispatch, () => ({ data: dataState }), undefined)
      }
      dataState = reducer(dataState, action)
      return action
    }

    await dispatch(loadLocalData())

    expect(dataState.base).toBe(base)
    expect(dataState.current).toBe(base)
    expect(dataState.outbox).toEqual([])
    expect(dataState.outboxRecoveryReason).toBe('outbox[0] is invalid')
    expect(dataState.journalRecoveryRequired).toBe(false)
    expect(storageMock.compactOneBatch).not.toHaveBeenCalled()
  })

  it('preserves a readable outbox and requests recovery if replay fails', async () => {
    storageMock.loadCurrent.mockRejectedValue(new Error('broken checkpoint'))
    const outbox = [{ type: 'patch' as const, patch: {}, issuedAt: 10 }]
    storageMock.loadOutboxForRecovery.mockResolvedValue({
      rootUserId: 7,
      outbox: { status: 'ready', commands: outbox },
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

    await dispatch(loadLocalData())

    expect(dataState.outbox).toEqual(outbox)
    expect(dataState.rootUserId).toBe(7)
    expect(dataState.journalRecoveryRequired).toBe(true)
    expect(dataState.journalRecoveryReason).toBe('broken checkpoint')
    warn.mockRestore()
  })

  it('quarantines a corrupt outbox independently from a corrupt journal', async () => {
    storageMock.loadCurrent.mockRejectedValue(new Error('broken checkpoint'))
    storageMock.loadOutboxForRecovery.mockResolvedValue({
      rootUserId: 7,
      outbox: { status: 'corrupt', reason: 'outbox[0] is invalid' },
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

    await dispatch(loadLocalData())

    expect(dataState.rootUserId).toBe(7)
    expect(dataState.outbox).toEqual([])
    expect(dataState.outboxRecoveryReason).toBe('outbox[0] is invalid')
    expect(dataState.journalRecoveryRequired).toBe(true)
    expect(dataState.journalRecoveryReason).toBe('broken checkpoint')
    warn.mockRestore()
  })

  it('discards a corrupt outbox only after the explicit recovery action', async () => {
    const base = makeStore({ serverTimestamp: 100 })
    storageMock.loadCurrent.mockResolvedValue({
      rootUserId: 7,
      base,
      outbox: { status: 'corrupt', reason: 'outbox[0] is invalid' },
    })
    let dataState = reducer(undefined, { type: 'test/init' })
    const getState = () => ({ data: dataState })
    const dispatch: any = (action: any) => {
      if (typeof action === 'function') {
        return action(dispatch, getState, undefined)
      }
      dataState = reducer(dataState, action)
      return action
    }
    await dispatch(loadLocalData())

    await dispatch(discardCorruptOutbox())

    expect(storageMock.discardOutbox).toHaveBeenCalledOnce()
    expect(dataState.outboxRecoveryReason).toBeNull()
  })

  it('persists an already fetched recovery snapshot after discarding its invalid outbox', async () => {
    let dataState = reducer(
      undefined,
      hydrateRecoveryOutbox({
        rootUserId: 7,
        outbox: [
          {
            type: 'patch',
            issuedAt: 10,
            patch: { account: [{ id: 'cash', instrument: 999 }] },
          },
        ],
        reason: 'broken checkpoint',
      })
    )
    dataState = reducer(
      dataState,
      receiveServerPatch({
        fullReload: true,
        serverTimestamp: 100,
        instrument: [makeInstrument({ id: 1 })],
        country: [{ id: 1, title: 'United States', currency: 1, domain: null }],
        user: [makeUser({ id: 7, parent: null, currency: 1 })],
        account: [
          makeAccount({ id: 'cash', user: 7, instrument: 1 }),
          makeAccount({
            id: 'debt',
            user: 7,
            instrument: 1,
            type: AccountType.Debt,
          }),
        ],
      })
    )
    dataState = reducer(dataState, rebaseServerInbox())
    const getState = () => ({ data: dataState })
    const dispatch: any = (action: any) => {
      if (typeof action === 'function') {
        return action(dispatch, getState, undefined)
      }
      dataState = reducer(dataState, action)
      return action
    }

    await dispatch(discardCorruptOutbox())

    expect(storageMock.discardOutbox).toHaveBeenCalledOnce()
    expect(storageMock.commitCanonical).toHaveBeenCalledWith({
      before: dataState.base,
      after: dataState.base,
      outbox: [],
      pushed: false,
      checkpointReason: 'recovery',
    })
    expect(dataState.outboxRecoveryReason).toBeNull()
    expect(dataState.journalRecoveryRequired).toBe(false)
  })
})

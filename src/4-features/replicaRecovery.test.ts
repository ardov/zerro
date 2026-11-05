import 'fake-indexeddb/auto'
import { configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TNormalizedPatch, TUser } from '@/6-shared/types'
import {
  captureError,
  captureMerchantUserWarnings,
} from '@/6-shared/diagnostics'
import { replicaStorage } from '@/6-shared/api/replicaStorage'
import { rootReducer } from '@/store/rootReducer'
import {
  hydrateRecoveryOutbox,
  redoClientCommand,
  undoClientCommand,
} from '@/store/data'
import {
  replicaPersistenceMiddleware,
  resetReplicaPersistenceForTests,
  waitForPersistedReplica,
} from '@/store/data/replicaPersistence'
import { applyPatch } from '@/zerro-core/replica'
import { testOperations } from '@/zerro-core/support/testing/commandTestData'
import {
  makeAccount,
  makeInstrument,
  makeMerchant,
  makeStore,
  makeTransaction,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { discardCorruptOutbox, loadLocalData } from './localData'
import { refreshData, reloadData, syncData } from './sync'

const { syncMock } = vi.hoisted(() => ({ syncMock: vi.fn() }))
vi.mock('@/6-shared/api/syncDiff', () => ({ sync: syncMock }))
vi.mock('@/6-shared/analytics', () => ({ track: vi.fn() }))
vi.mock('@/6-shared/diagnostics', () => ({
  captureError: vi.fn(),
  captureMerchantUserWarnings: vi.fn(),
}))
vi.mock('@/6-shared/api/replicaStorage', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/6-shared/api/replicaStorage')>()
  return {
    ...actual,
    replicaStorage: actual.createReplicaStorage('replica-recovery-test'),
  }
})

beforeEach(async () => {
  resetReplicaPersistenceForTests()
  vi.clearAllMocks()
  await replicaStorage.clear()
})

afterEach(async () => {
  await waitForPersistedReplica()
  vi.restoreAllMocks()
})

function newApp() {
  return configureStore({
    reducer: rootReducer,
    middleware: getDefault => getDefault().concat(replicaPersistenceMiddleware),
  })
}

function familyResponse(country: TUser['country']): TNormalizedPatch {
  return {
    serverTimestamp: 100_000,
    instrument: [makeInstrument({ id: 1 })],
    country: [{ id: 1, title: 'United States', currency: 1, domain: null }],
    user: [
      makeUser({
        id: 7,
        parent: null,
        currency: 1,
        country,
        countryCode: 'GB',
      }),
      makeUser({ id: 8, parent: 7, currency: 1, country, countryCode: 'BY' }),
    ],
    account: [
      makeAccount({ id: 'cash', user: 7, title: 'Cash' }),
      makeAccount({ id: 'debt', user: 7, type: 'debt' }),
    ],
  }
}

const pending = {
  issuedAt: 10,
  operations: testOperations({ account: [{ id: 'cash', title: 'Wallet' }] }),
}

async function seed(country: TUser['country'], outbox = [pending]) {
  const base = applyPatch(makeStore(), familyResponse(country))
  await replicaStorage.commitCanonical({
    before: base,
    after: base,
    outbox: [],
    pushed: false,
    checkpointReason: 'full-sync',
  })
  await replicaStorage.saveOutbox(7, outbox)
  return base
}

describe('replica recovery across persisted reloads', () => {
  it.each([undefined, null, 999])(
    'preserves a merchant with user %s through local load, recovery, pull and push',
    async user => {
      const merchant = makeMerchant({ id: 'shop', user, title: 'Shop' })
      if (user === undefined) delete merchant.user
      const response = {
        ...familyResponse(null),
        merchant: [merchant],
        transaction: [
          makeTransaction({
            id: 'purchase',
            user: 7,
            merchant: 'shop',
            incomeAccount: 'cash',
            outcomeAccount: 'cash',
            outcome: 10,
          }),
        ],
      }
      const base = applyPatch(makeStore(), response)
      await replicaStorage.commitCanonical({
        before: base,
        after: base,
        outbox: [],
        pushed: false,
        checkpointReason: 'full-sync',
      })
      await replicaStorage.saveOutbox(7, [pending])
      const app = newApp()
      await app.dispatch(loadLocalData())
      expect(app.getState().data).toMatchObject({
        journalRecoveryRequired: false,
        outboxRecoveryReason: null,
        outbox: [pending],
        current: {
          merchant: { shop: merchant },
          transaction: { purchase: { merchant: 'shop' } },
          account: { cash: { title: 'Wallet' } },
        },
      })
      expect(captureMerchantUserWarnings).toHaveBeenCalledWith(base, 'local')
      app.dispatch(undoClientCommand())
      expect(app.getState().data.current.account.cash.title).toBe('Cash')
      app.dispatch(redoClientCommand())
      expect(app.getState().data.current.account.cash.title).toBe('Wallet')

      app.dispatch(
        hydrateRecoveryOutbox({
          rootUserId: 7,
          outbox: [pending],
          reason: 'previous merchant owner validation',
        })
      )
      syncMock.mockResolvedValueOnce({ data: response })
      await app.dispatch(reloadData())
      await waitForPersistedReplica()
      expect(app.getState().sync.lastResult?.isSuccessful).toBe(true)
      expect(captureMerchantUserWarnings).toHaveBeenCalledWith(
        base,
        'full-reload'
      )
      const reopened = newApp()
      await reopened.dispatch(loadLocalData())
      expect(reopened.getState().data.current.merchant.shop).toEqual(merchant)
      expect(
        reopened.getState().data.current.transaction.purchase.merchant
      ).toBe('shop')
      expect(reopened.getState().data.outbox).toEqual([pending])

      syncMock.mockResolvedValueOnce({ data: { serverTimestamp: 200_000 } })
      await reopened.dispatch(refreshData())
      expect(captureMerchantUserWarnings).toHaveBeenCalledWith(
        reopened.getState().data.base,
        'pull'
      )
      syncMock.mockImplementationOnce(async (_token, _endpoint, patch) => ({
        data: { ...patch, serverTimestamp: 300_000 },
      }))
      await reopened.dispatch(syncData())
      await waitForPersistedReplica()
      expect(reopened.getState().sync.lastResult?.isSuccessful).toBe(true)
      expect(reopened.getState().data.outbox).toEqual([])
      expect(reopened.getState().data.current.merchant.shop).toEqual(merchant)
      expect(captureMerchantUserWarnings).toHaveBeenCalledWith(
        reopened.getState().data.base,
        'push'
      )
      expect(captureError).not.toHaveBeenCalled()
    }
  )

  it('loads a family with null countries and preserves pending edits through reload and undo/redo', async () => {
    await seed(null)
    const app = newApp()
    await app.dispatch(loadLocalData())
    expect(app.getState().data).toMatchObject({
      journalRecoveryRequired: false,
      outboxRecoveryReason: null,
      outbox: [pending],
      current: {
        user: { 7: { country: null }, 8: { country: null, parent: 7 } },
        account: { cash: { title: 'Wallet' } },
      },
    })
    app.dispatch(undoClientCommand())
    expect(app.getState().data.current.account.cash.title).toBe('Cash')
    app.dispatch(redoClientCommand())
    expect(app.getState().data.current.account.cash.title).toBe('Wallet')

    syncMock.mockResolvedValueOnce({ data: familyResponse(null) })
    await app.dispatch(reloadData())
    await waitForPersistedReplica()
    const reopened = newApp()
    await reopened.dispatch(loadLocalData())
    expect(reopened.getState().data).toMatchObject({
      journalRecoveryRequired: false,
      outboxRecoveryReason: null,
      outbox: [pending],
      current: { account: { cash: { title: 'Wallet' } } },
    })
    expect(captureError).not.toHaveBeenCalled()
  })

  it.each([false, true])(
    'rejects an invalid full snapshot without overwriting data or blaming the outbox (recovering: %s)',
    async recovering => {
      const base = await seed(1)
      const historyBefore = await replicaStorage.listHistory({ limit: 10 })
      const app = newApp()
      await app.dispatch(loadLocalData())
      if (recovering) {
        app.dispatch(
          hydrateRecoveryOutbox({
            rootUserId: 7,
            outbox: [pending],
            reason: 'previous invalid snapshot',
          })
        )
      }
      syncMock.mockResolvedValueOnce({
        data: { ...familyResponse(999), serverTimestamp: 200_000 },
      })

      await app.dispatch(reloadData())
      await waitForPersistedReplica()
      expect(app.getState().data).toMatchObject({
        base,
        outbox: [pending],
        journalRecoveryRequired: true,
        journalRecoveryReason: 'user[0].country references a missing entity',
        outboxRecoveryReason: null,
      })
      expect(app.getState().sync.lastResult?.isSuccessful).toBe(false)
      expect(captureError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            'user[0].country references a missing entity'
          ),
        })
      )
      expect(await replicaStorage.listHistory({ limit: 10 })).toEqual(
        historyBefore
      )
      expect(await replicaStorage.loadCurrent()).toMatchObject({
        base,
        outbox: { status: 'ready', commands: [pending] },
      })

      syncMock.mockResolvedValueOnce({ data: familyResponse(1) })
      await app.dispatch(reloadData())
      await waitForPersistedReplica()
      expect(app.getState().sync.lastResult?.isSuccessful).toBe(true)
      const reopened = newApp()
      await reopened.dispatch(loadLocalData())
      expect(reopened.getState().data).toMatchObject({
        journalRecoveryRequired: false,
        outboxRecoveryReason: null,
        outbox: [pending],
        current: { account: { cash: { title: 'Wallet' } } },
      })
    }
  )

  it('quarantines only the outbox when its replay is invalid and persists the valid family snapshot after explicit discard', async () => {
    const broken = {
      issuedAt: 10,
      operations: testOperations({
        account: [{ id: 'cash', instrument: 999 }],
      }),
    }
    await seed(1, [broken])
    const app = newApp()
    app.dispatch(
      hydrateRecoveryOutbox({
        rootUserId: 7,
        outbox: [broken],
        reason: 'broken checkpoint',
      })
    )
    syncMock.mockResolvedValueOnce({ data: familyResponse(null) })
    await app.dispatch(reloadData())
    await waitForPersistedReplica()
    expect(app.getState().data.outboxRecoveryReason).toBe(
      'account[0].instrument references a missing entity'
    )
    expect(app.getState().sync.lastResult?.isSuccessful).toBe(false)
    expect(await replicaStorage.loadOutboxForRecovery()).toMatchObject({
      outbox: { status: 'ready', commands: [broken] },
    })
    expect(captureError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          'account[0].instrument references a missing entity'
        ),
      })
    )

    await app.dispatch(discardCorruptOutbox())
    const reopened = newApp()
    await reopened.dispatch(loadLocalData())
    expect(reopened.getState().data).toMatchObject({
      journalRecoveryRequired: false,
      outboxRecoveryReason: null,
      outbox: [],
      current: { user: { 7: { country: null }, 8: { country: null } } },
    })
  })
})

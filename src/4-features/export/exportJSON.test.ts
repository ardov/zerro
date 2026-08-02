import { describe, expect, it } from 'vitest'
import type { TCommand } from 'zerro-core/replica'
import { makeTestRootState } from 'store/testing'
import {
  makeAccount,
  makeStore,
} from 'zerro-core/support/testing/zenmoneyTestData'

import { getBackupContent } from './exportJSON'

describe('getBackupContent', () => {
  it('exports only the synchronized base when local commands are pending', () => {
    const base = makeStore({
      serverTimestamp: 1_000,
      account: { base: makeAccount({ id: 'base', title: 'Synchronized' }) },
    })
    const current = makeStore({
      serverTimestamp: 2_000,
      account: {
        current: makeAccount({ id: 'current', title: 'Unsynchronized' }),
      },
    })
    const state = makeTestRootState(current, {
      data: {
        base,
        current,
        outbox: [{} as TCommand],
        redo: [],
        journal: null,
        journalPersistenceBlocked: false,
        journalRecoveryRequired: false,
        journalRecoveryReason: null,
      },
    })

    const backup = JSON.parse(getBackupContent(state))

    expect(backup.serverTimestamp).toBe(1)
    expect(backup.account).toEqual([
      expect.objectContaining({ id: 'base', title: 'Synchronized' }),
    ])
    expect(JSON.stringify(backup)).not.toContain('Unsynchronized')
  })
})

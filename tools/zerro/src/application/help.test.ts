// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { getHelp } from './help'

describe('local tool help manifest', () => {
  it('describes every W0-W3 command with explicit side effects', () => {
    const result = getHelp({
      observedAt: '2026-07-29T00:00:00.000Z',
      baseServerTimestampMs: 0,
      stateRevision: 'revision',
      pendingCommandCount: 0,
      balancePendingCanonicalSync: false,
    })

    expect(
      result.data.commands.map(command => [command.name, command.effect])
    ).toEqual([
      ['help', 'none'],
      ['status', 'none'],
      ['refresh', 'local'],
      ['accounts list', 'none'],
      ['tags search', 'none'],
      ['merchants search', 'none'],
      ['transactions search', 'none'],
      ['month get', 'none'],
      ['envelopes list', 'none'],
      ['envelopes get', 'none'],
      ['goals list', 'none'],
      ['debtors list', 'none'],
      ['budget preview-set', 'none'],
      ['budget stage-set', 'local'],
      ['outbox list', 'none'],
      ['outbox undo', 'local'],
      ['transaction preview-create', 'none'],
      ['transaction stage-create', 'local'],
    ])
  })
})

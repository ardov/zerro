import { describe, expect, it } from 'vitest'
import { buildOutboxTransport, parseCommandOutbox } from '@/zerro-core/replica'
import {
  makeStore,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { convertDiff } from './converters'

describe('account creation wire contract', () => {
  it('sends a non-null correction mode when replaying a minimal data-account creation', () => {
    const base = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })
    // The persisted command predates the default fix and contains no mode.
    const outbox = parseCommandOutbox(
      JSON.parse(
        JSON.stringify([
          {
            issuedAt: 1000,
            operations: [
              {
                type: 'account.create',
                value: {
                  id: 'data-account',
                  instrument: 2,
                  title: '🤖 [Zerro Data]',
                },
              },
            ],
          },
        ])
      )
    )
    const patch = buildOutboxTransport(base, outbox, 2000)
    expect(patch).toBeDefined()
    const wire = JSON.parse(JSON.stringify(convertDiff.toServer(patch!)))
    expect(wire.account).toHaveLength(1)
    expect(wire.account[0]).toMatchObject({
      id: 'data-account',
      enableCorrection: false,
      balanceCorrectionType: 'disabled',
    })
  })
})

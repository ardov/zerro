import { describe, expect, it } from 'vitest'

import {
  makeStore,
  makeTransaction,
  makeUser,
} from '../../../support/testing/zenmoneyTestData'
import { applyPatch } from '../../domain/zenmoney/model/applyPatch'
import {
  issuePatch,
  materializeCommand,
  materializePrimaryCommand,
  type TCommand,
} from './materializeCommand'

describe('transaction creation metadata', () => {
  it.each([
    { before: 'Bank terminal', after: 'Edited terminal' },
    { before: 'Bank terminal', after: null },
    { before: null, after: 'Edited terminal' },
  ])(
    'preserves originalPayee=$before while editing payee',
    ({ before, after }) => {
      const transaction = makeTransaction({
        id: 'transaction',
        originalPayee: before,
        payee: 'Old shop',
      })
      const snapshot = makeStore({ transaction: { transaction } })
      const patch = {
        transaction: [
          { id: transaction.id, originalPayee: after, payee: 'New shop' },
        ],
      }
      const issued = issuePatch(snapshot, patch, 100)
      expect(issued.patch).toEqual({
        transaction: [{ id: transaction.id, payee: 'New shop' }],
      })

      // Already persisted commands must obey the same rules during replay.
      const persisted: TCommand = { type: 'patch', issuedAt: 100, patch }
      for (const command of [issued, persisted]) {
        const current = applyPatch(
          snapshot,
          materializeCommand(snapshot, command)
        )
        expect(current.transaction.transaction).toMatchObject({
          originalPayee: before,
          payee: 'New shop',
        })
        expect(
          materializePrimaryCommand(snapshot, command).transaction?.[0]
        ).toMatchObject({
          originalPayee: before,
          payee: 'New shop',
        })
        expect(materializeCommand(current, command)).toEqual({})
      }
    }
  )

  it('drops an immutable-only command both at issue and replay', () => {
    const transaction = makeTransaction({
      id: 'transaction',
      originalPayee: 'Original',
    })
    const snapshot = makeStore({ transaction: { transaction } })
    const patch = {
      transaction: [{ id: transaction.id, originalPayee: 'Replacement' }],
    }
    expect(issuePatch(snapshot, patch, 100).patch).toEqual({})
    expect(
      materializePrimaryCommand(snapshot, {
        type: 'patch',
        issuedAt: 100,
        patch,
      })
    ).toEqual({})
  })

  it('keeps an explicit originalPayee when creating a missing id', () => {
    const snapshot = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })
    const source = makeTransaction({
      id: 'new',
      payee: 'Visible shop',
      originalPayee: 'Bank terminal',
      outcome: 10,
    })
    const command = issuePatch(snapshot, { transaction: [source] }, 100)
    expect(command.patch.transaction?.[0].originalPayee).toBe('Bank terminal')
    const current = applyPatch(snapshot, materializeCommand(snapshot, command))
    expect(current.transaction.new).toMatchObject({
      payee: 'Visible shop',
      originalPayee: 'Bank terminal',
    })
    // Once that id exists, replay cannot overwrite newer canonical metadata.
    const canonical = makeStore({
      ...current,
      transaction: {
        new: {
          ...current.transaction.new,
          originalPayee: 'Canonical terminal',
        },
      },
    })
    expect(materializePrimaryCommand(canonical, command)).toEqual({})
  })
})

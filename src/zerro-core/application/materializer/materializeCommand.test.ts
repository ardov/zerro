import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeBudget,
  makeMerchant,
  makeReminder,
  makeStore,
  makeTag,
  makeTransaction,
  makeUser,
} from '../../testing/zenmoneyTestData'
import { DataEntity } from '../../domain/patch'
import { compileDeleteTransactions } from '../../domain/zenmoney/transactions'
import {
  compileSetSimpleHiddenData,
  HiddenDataType,
} from '../../domain/zerro/hidden-data'
import {
  isCommandRebaseSafe,
  issuePatch,
  materializeCommand,
  type TCommand,
} from './materializeCommand'

describe('materializeCommand', () => {
  it('applies a sparse transaction patch over the latest full entity', () => {
    const current = makeTransaction({
      id: 'tr-1',
      changed: 200,
      income: 11,
      viewed: true,
    })
    const snapshot = makeStore({ transaction: { 'tr-1': current } })
    const command = issuePatch(
      snapshot,
      { transaction: [{ id: 'tr-1', viewed: false }] },
      100
    )

    expect(materializeCommand(snapshot, command)).toEqual({
      transaction: [{ ...current, viewed: false, changed: 1200 }],
    })
  })

  it('patches a batch and skips no-op, deleted, or missing targets', () => {
    const first = makeTransaction({ id: 'first', viewed: false })
    const second = makeTransaction({ id: 'second', viewed: true })
    const deleted = makeTransaction({ id: 'deleted', deleted: true })
    const snapshot = makeStore({ transaction: { first, second, deleted } })
    const command = issuePatch(
      snapshot,
      {
        transaction: ['first', 'second', 'deleted', 'missing'].map(id => ({
          id,
          viewed: true,
        })),
      },
      100
    )

    expect(
      materializeCommand(snapshot, command).transaction?.map(
        transaction => transaction.id
      )
    ).toEqual(['first'])
  })

  it('materializes a missing sparse target as an empty patch', () => {
    const command = issuePatch(
      makeStore(),
      { transaction: [{ id: 'missing', viewed: true }] },
      100
    )

    expect(materializeCommand(makeStore(), command)).toEqual({})
  })

  it('filters system fields from stale runtime transaction patches', () => {
    const current = makeTransaction({
      id: 'tr-1',
      created: 100,
      comment: 'Before',
    })
    const command = {
      type: 'patch',
      issuedAt: 300,
      patch: {
        transaction: [{ id: 'tr-1', created: 500, comment: 'After' }],
      },
    } as unknown as TCommand

    expect(
      materializeCommand(
        makeStore({ transaction: { 'tr-1': current } }),
        command
      ).transaction?.[0]
    ).toMatchObject({ created: 100, comment: 'After' })
  })

  it('preserves transaction lifecycle intent while filtering system fields', () => {
    const current = makeTransaction({ id: 'tr-1', deleted: false })
    const snapshot = makeStore({ transaction: { 'tr-1': current } })
    const command = issuePatch(
      snapshot,
      compileDeleteTransactions(snapshot, current.id, { now: () => 100 }),
      100
    )

    expect(materializeCommand(snapshot, command).transaction?.[0]).toEqual({
      ...current,
      deleted: true,
      changed: 1001,
    })
  })

  it('recreates a transaction as two intents in the same command', () => {
    const source = makeTransaction({
      id: 'source',
      changed: 200,
      created: 100,
      income: 0,
      outcome: 25,
      comment: 'Before',
    })
    const replacement = {
      ...source,
      id: 'replacement',
      created: 500,
      comment: 'After',
    }
    const snapshot = makeStore({ transaction: { source } })
    const command = issuePatch(
      snapshot,
      {
        transaction: [
          { id: source.id, income: 0.00001, outcome: 0.00001 },
          replacement,
        ],
      },
      300
    )

    const initial = materializeCommand(snapshot, command)
    expect(initial.transaction).toEqual([
      { ...source, income: 0.00001, outcome: 0.00001, changed: 1200 },
      { ...replacement, changed: 300 },
    ])

    const hiddenSource = initial.transaction![0]
    const retry = materializeCommand(
      makeStore({ transaction: { source: hiddenSource } }),
      command,
      400
    )
    expect(retry.transaction).toEqual([{ ...replacement, changed: 400 }])
  })

  it('compiles an existing account result to sparse intent', () => {
    const account = makeAccount({ id: 'cash', changed: 500, title: 'Cash' })
    const snapshot = makeStore({ account: { cash: account } })
    const command = issuePatch(
      snapshot,
      { account: [{ ...account, title: 'Wallet' }] },
      100
    )

    expect(command.patch).toEqual({
      account: [{ id: 'cash', title: 'Wallet' }],
    })
    expect(materializeCommand(snapshot, command).account?.[0]).toMatchObject({
      title: 'Wallet',
      changed: 1500,
    })
  })

  it('compiles an existing reminder result to sparse intent', () => {
    const reminder = makeReminder('rent', { comment: 'Before', notify: false })
    const snapshot = makeStore({ reminder: { rent: reminder } })
    const command = issuePatch(
      snapshot,
      { reminder: [{ ...reminder, comment: 'After', notify: true }] },
      100
    )

    expect(command.patch).toEqual({
      reminder: [{ id: 'rent', comment: 'After', notify: true }],
    })
    expect(materializeCommand(snapshot, command).reminder?.[0]).toMatchObject({
      id: 'rent',
      comment: 'After',
      notify: true,
    })
  })

  it('compiles existing merchant and tag results to sparse intent', () => {
    const merchant = makeMerchant({ id: 'shop', title: 'Shop' })
    const tag = makeTag({ id: 'food', title: 'Food', color: null })
    const snapshot = makeStore({
      merchant: { shop: merchant },
      tag: { food: tag },
    })
    const command = issuePatch(
      snapshot,
      {
        merchant: [{ ...merchant, title: 'Market' }],
        tag: [{ ...tag, title: 'Groceries', color: 0x00ff00 }],
      },
      100
    )

    expect(command.patch).toEqual({
      merchant: [{ id: 'shop', title: 'Market' }],
      tag: [{ id: 'food', title: 'Groceries', color: 0x00ff00 }],
    })
    expect(materializeCommand(snapshot, command)).toEqual({
      merchant: [{ ...merchant, title: 'Market', changed: 1000 }],
      tag: [{ ...tag, title: 'Groceries', color: 0x00ff00, changed: 1000 }],
    })
  })

  it('compiles an existing budget result to sparse intent', () => {
    const budget = makeBudget({
      id: '2026-01-01#food',
      date: '2026-01-01',
      tag: 'food',
      outcome: 100,
    })
    const snapshot = makeStore({ budget: { [budget.id]: budget } })
    const command = issuePatch(
      snapshot,
      {
        budget: [
          {
            ...budget,
            income: 50,
            incomeLock: false,
            isIncomeForecast: true,
            outcome: 200,
            outcomeLock: false,
            isOutcomeForecast: true,
          },
        ],
      },
      100
    )

    expect(command.patch).toEqual({
      budget: [
        {
          id: budget.id,
          income: 50,
          incomeLock: false,
          isIncomeForecast: true,
          outcome: 200,
          outcomeLock: false,
          isOutcomeForecast: true,
        },
      ],
    })
    expect(materializeCommand(snapshot, command).budget?.[0]).toEqual({
      ...budget,
      income: 50,
      incomeLock: false,
      isIncomeForecast: true,
      outcome: 200,
      outcomeLock: false,
      isOutcomeForecast: true,
      changed: 1001,
    })
  })

  it('stores deletion identity and materializes protocol metadata', () => {
    const snapshot = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })
    const command = issuePatch(
      snapshot,
      {
        deletion: [
          {
            id: 'rent',
            object: DataEntity.Reminder,
            stamp: 50,
            user: 1,
          },
        ],
      },
      100
    )

    expect(command.patch).toEqual({
      deletion: [{ id: 'rent', object: DataEntity.Reminder }],
    })
    expect(materializeCommand(snapshot, command)).toEqual({
      deletion: [
        {
          id: 'rent',
          object: DataEntity.Reminder,
          stamp: 100,
          user: 1,
        },
      ],
    })
  })

  it('stores minimal account creation intent and materializes through factory', () => {
    const snapshot = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })
    const account = makeAccount({
      id: 'new-account',
      changed: 100,
      user: 1,
      instrument: 2,
      title: 'Wallet',
    })
    const command = issuePatch(snapshot, { account: [account] }, 100)

    expect(command.patch).toEqual({
      account: [
        {
          id: 'new-account',
          instrument: 2,
          title: 'Wallet',
        },
      ],
    })
    expect(materializeCommand(snapshot, command).account?.[0]).toEqual(account)
  })

  it('stores minimal reminder creation intent and materializes through factory', () => {
    const snapshot = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })
    const reminder = makeReminder({
      id: 'new-reminder',
      changed: 100,
      user: 1,
      incomeAccount: 'cash',
      outcomeAccount: 'card',
      comment: 'Rent',
      startDate: '1970-01-01',
      endDate: '1970-01-01',
    })
    const command = issuePatch(snapshot, { reminder: [reminder] }, 100)

    expect(command.patch).toEqual({
      reminder: [
        {
          id: 'new-reminder',
          incomeAccount: 'cash',
          outcomeAccount: 'card',
          comment: 'Rent',
        },
      ],
    })
    expect(materializeCommand(snapshot, command).reminder?.[0]).toEqual(
      reminder
    )
  })

  it('stores minimal merchant creation intent and materializes through factory', () => {
    const snapshot = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })
    const merchant = makeMerchant({
      id: 'new-merchant',
      changed: 100,
      user: 1,
      title: 'Market',
    })
    const command = issuePatch(snapshot, { merchant: [merchant] }, 100)

    expect(command.patch).toEqual({
      merchant: [{ id: 'new-merchant', title: 'Market' }],
    })
    expect(materializeCommand(snapshot, command).merchant?.[0]).toEqual(
      merchant
    )
  })

  it('stores minimal tag creation intent and materializes through factory', () => {
    const snapshot = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })
    const tag = makeTag({
      id: 'new-tag',
      changed: 100,
      user: 1,
      title: 'Food',
      showOutcome: true,
    })
    const command = issuePatch(snapshot, { tag: [tag] }, 100)

    expect(command.patch).toEqual({
      tag: [{ id: 'new-tag', title: 'Food', showOutcome: true }],
    })
    expect(materializeCommand(snapshot, command).tag?.[0]).toEqual(tag)
  })

  it('stores minimal budget creation intent and materializes through factory', () => {
    const snapshot = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })
    const budget = makeBudget({
      id: '2026-01-01#null',
      changed: 100,
      user: 1,
      date: '2026-01-01',
      tag: null,
      income: 50,
      incomeLock: false,
      isIncomeForecast: true,
      outcome: 200,
      outcomeLock: false,
      isOutcomeForecast: true,
    })
    const command = issuePatch(snapshot, { budget: [budget] }, 100)

    expect(command.patch).toEqual({
      budget: [
        {
          id: '2026-01-01#null',
          tag: null,
          date: '2026-01-01',
          income: 50,
          incomeLock: false,
          isIncomeForecast: true,
          outcome: 200,
          outcomeLock: false,
          isOutcomeForecast: true,
        },
      ],
    })
    expect(materializeCommand(snapshot, command).budget?.[0]).toEqual(budget)
  })

  it('stores hidden data through account and reminder intent', () => {
    const snapshot = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })
    const ids = ['data-account', 'settings-reminder']
    const patch = compileSetSimpleHiddenData(
      snapshot,
      HiddenDataType.UserSettings,
      { emojiIcons: true },
      { now: () => 100, uuid: () => ids.shift() || 'unused' }
    )
    const command = issuePatch(snapshot, patch, 100)

    expect(command.patch).toEqual({
      account: [
        {
          id: 'data-account',
          instrument: 2,
          title: '🤖 [Zerro Data]',
        },
      ],
      reminder: [
        {
          id: 'settings-reminder',
          incomeAccount: 'data-account',
          outcomeAccount: 'data-account',
          income: 1,
          startDate: '2020-01-01',
          endDate: '2020-01-01',
          comment: JSON.stringify({
            type: HiddenDataType.UserSettings,
            payload: { emojiIcons: true },
          }),
        },
      ],
    })
    expect(materializeCommand(snapshot, command)).toEqual(patch)
  })

  it('rejects incomplete creation intent before persistence', () => {
    const snapshot = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })

    expect(() =>
      issuePatch(
        snapshot,
        { account: [{ id: 'new-account', title: 'Wallet' }] },
        100
      )
    ).toThrow('Cannot create account: missing instrument')
    expect(() =>
      issuePatch(
        snapshot,
        { reminder: [{ id: 'new-reminder', incomeAccount: 'cash' }] },
        100
      )
    ).toThrow('Cannot create reminder: missing outcomeAccount')
    expect(() =>
      issuePatch(snapshot, { merchant: [{ id: 'new-merchant' }] }, 100)
    ).toThrow('Cannot create merchant: missing title')
    expect(() =>
      issuePatch(snapshot, { tag: [{ id: 'new-tag' }] }, 100)
    ).toThrow('Cannot create tag: missing title')
    expect(() =>
      issuePatch(
        snapshot,
        { budget: [{ id: '2026-01-01#food', tag: 'food' }] },
        100
      )
    ).toThrow('Cannot create budget: missing date')
    expect(() =>
      issuePatch(
        snapshot,
        {
          budget: [
            {
              id: '2026-02-01#food',
              tag: 'food',
              date: '2026-01-01',
            },
          ],
        },
        100
      )
    ).toThrow('Cannot create budget: id does not match date and tag')
  })

  it('marks supported sparse updates and creations as rebase-safe', () => {
    expect(
      isCommandRebaseSafe(
        issuePatch(
          makeStore(),
          { transaction: [{ id: 'tr-1', viewed: true }] },
          100
        )
      )
    ).toBe(true)
    const account = makeAccount({ id: 'cash', title: 'Cash' })
    expect(
      isCommandRebaseSafe(
        issuePatch(
          makeStore({ account: { cash: account } }),
          { account: [{ ...account, title: 'Wallet' }] },
          100
        )
      )
    ).toBe(true)
    const creationSnapshot = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })
    expect(
      isCommandRebaseSafe(
        issuePatch(
          creationSnapshot,
          { account: [makeAccount({ id: 'cash', title: 'Wallet' })] },
          100
        )
      )
    ).toBe(true)
    expect(
      isCommandRebaseSafe(
        issuePatch(
          creationSnapshot,
          { tag: [makeTag({ id: 'food', title: 'Food' })] },
          100
        )
      )
    ).toBe(true)
    expect(
      isCommandRebaseSafe(
        issuePatch(
          creationSnapshot,
          {
            budget: [
              makeBudget({
                id: '2026-01-01#food',
                date: '2026-01-01',
                tag: 'food',
              }),
            ],
          },
          100
        )
      )
    ).toBe(true)
  })
})

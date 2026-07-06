import { describe, expect, it } from 'vitest'
import type { TDataStore, TTag } from '6-shared/types'
import { compileCreateTag, compilePatchTag } from './commands'

describe('zenmoney tag commands', () => {
  it('patches existing tags with deterministic time', () => {
    const data = makeStore({
      tag: {
        food: tag({ id: 'food', title: 'Food', changed: 1 }),
      },
    })

    const patch = compilePatchTag(
      data,
      { id: 'food', title: 'Groceries', budgetOutcome: true },
      { now: () => 100 }
    )

    expect(patch.tag?.[0]).toMatchObject({
      id: 'food',
      title: 'Groceries',
      budgetOutcome: true,
      changed: 100,
    })
  })

  it('creates tags with root user and deterministic id/time', () => {
    const data = makeStore({
      user: {
        2: { id: 2, parent: 1 },
        1: { id: 1, parent: null },
      } as any,
    })

    const patch = compileCreateTag(
      data,
      { title: 'Travel', budgetOutcome: true },
      { now: () => 100, uuid: () => 'tag-new' }
    )

    expect(patch.tag?.[0]).toMatchObject({
      id: 'tag-new',
      changed: 100,
      user: 1,
      title: 'Travel',
      parent: null,
      budgetIncome: false,
      budgetOutcome: true,
      required: false,
    })
  })

  it('routes create with id through patch semantics', () => {
    const data = makeStore({
      tag: {
        food: tag({ id: 'food', title: 'Food', changed: 1 }),
      },
    })

    const patch = compileCreateTag(
      data,
      { id: 'food', title: 'Groceries' },
      { now: () => 100, uuid: () => 'unused' }
    )

    expect(patch.tag?.[0]).toMatchObject({
      id: 'food',
      title: 'Groceries',
      changed: 100,
    })
  })

  it('validates tag commands', () => {
    const data = makeStore({
      tag: {
        food: tag({ id: 'food', title: 'Food', changed: 1 }),
      },
    })

    expect(() =>
      compilePatchTag(data, { title: 'No id' } as any, { now: () => 1 })
    ).toThrow('Trying to patch tag without id')
    expect(() =>
      compilePatchTag(data, { id: 'null', title: 'Null tag' }, { now: () => 1 })
    ).toThrow('Trying to patch null tag')
    expect(() =>
      compilePatchTag(
        data,
        { id: 'missing', title: 'Missing' },
        { now: () => 1 }
      )
    ).toThrow('Tag not found')
    expect(() =>
      compileCreateTag(
        makeStore(),
        { title: 'No user' },
        {
          now: () => 1,
          uuid: () => 'tag',
        }
      )
    ).toThrow('No user')
    expect(() =>
      compileCreateTag(data, {} as any, {
        now: () => 1,
        uuid: () => 'tag',
      })
    ).toThrow('Trying to create tag without title')
  })
})

function makeStore(patch: Partial<TDataStore> = {}): TDataStore {
  return {
    serverTimestamp: 0,
    instrument: {},
    country: {},
    company: {},
    user: {},
    merchant: {},
    account: {},
    tag: {},
    budget: {},
    reminder: {},
    reminderMarker: {},
    transaction: {},
    ...patch,
  } as TDataStore
}

function tag(patch: Partial<TTag> & { id: string }): TTag {
  return {
    changed: 0,
    user: 1,
    title: '',
    parent: null,
    icon: null,
    staticId: null,
    picture: null,
    color: null,
    showIncome: false,
    showOutcome: false,
    budgetIncome: false,
    budgetOutcome: false,
    required: false,
    ...patch,
  } as TTag
}

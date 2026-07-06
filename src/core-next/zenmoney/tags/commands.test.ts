import { describe, expect, it } from 'vitest'
import {
  makeStore,
  makeTag as makeTestTag,
} from '../../testing/zenmoneyTestData'
import { compileCreateTag, compilePatchTag } from './commands'
import { makeTag } from './factory'

describe('zenmoney tag commands', () => {
  it('patches existing tags with deterministic time', () => {
    const data = makeStore({
      tag: {
        food: makeTestTag({ id: 'food', title: 'Food', changed: 1 }),
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

    expect(patch.tag?.[0]).toEqual(
      makeTag(
        {
          id: 'tag-new',
          changed: 100,
          user: 1,
          title: 'Travel',
          budgetOutcome: true,
        },
        {
          now: () => 0,
          uuid: () => 'unused',
        }
      )
    )
  })

  it('creates production tag defaults through the tag factory', () => {
    expect(
      makeTag(
        {
          user: 1,
          title: 'Travel',
        },
        {
          now: () => 100,
          uuid: () => 'tag-new',
        }
      )
    ).toEqual(
      makeTestTag({ id: 'tag-new', changed: 100, user: 1, title: 'Travel' })
    )
  })

  it('routes create with id through patch semantics', () => {
    const data = makeStore({
      tag: {
        food: makeTestTag({ id: 'food', title: 'Food', changed: 1 }),
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
        food: makeTestTag({ id: 'food', title: 'Food', changed: 1 }),
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

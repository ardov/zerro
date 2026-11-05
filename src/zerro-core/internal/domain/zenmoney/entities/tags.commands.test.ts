import { describe, expect, it } from 'vitest'
import {
  makeStore,
  makeTag as makeTestTag,
} from '../../../../support/testing/zenmoneyTestData'
import { compileCreateTag, compilePatchTag } from './tags'
import { makeTag } from './tags'

describe('zenmoney tag commands', () => {
  it('compiles sparse patches for existing tags', () => {
    const data = makeStore({
      tag: {
        food: makeTestTag({ id: 'food', title: 'Food', changed: 1 }),
      },
    })

    const patch = compilePatchTag(data.tag, {
      id: 'food',
      title: 'Groceries',
      budgetOutcome: true,
    })

    expect(patch.tag?.[0]).toMatchObject({
      id: 'food',
      title: 'Groceries',
      budgetOutcome: true,
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
      { tags: data.tag, users: data.user },
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
      { tags: data.tag, users: data.user },
      { id: 'food', title: 'Groceries' },
      { now: () => 100, uuid: () => 'unused' }
    )

    expect(patch.tag?.[0]).toMatchObject({
      id: 'food',
      title: 'Groceries',
    })
  })

  it('validates tag commands', () => {
    const data = makeStore({
      tag: {
        food: makeTestTag({ id: 'food', title: 'Food', changed: 1 }),
      },
    })

    expect(() => compilePatchTag(data.tag, { title: 'No id' } as any)).toThrow(
      'Trying to patch tag without id'
    )
    expect(() =>
      compilePatchTag(data.tag, { id: 'null', title: 'Null tag' })
    ).toThrow('Trying to patch null tag')
    expect(() =>
      compilePatchTag(data.tag, { id: 'missing', title: 'Missing' })
    ).toThrow('Tag not found')
    expect(() =>
      compileCreateTag(
        { tags: makeStore().tag, users: makeStore().user },
        { title: 'No user' },
        {
          now: () => 1,
          uuid: () => 'tag',
        }
      )
    ).toThrow('No user')
    expect(() =>
      compileCreateTag({ tags: data.tag, users: data.user }, {} as any, {
        now: () => 1,
        uuid: () => 'tag',
      })
    ).toThrow('Trying to create tag without title')
  })
})

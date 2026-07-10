import { describe, expect, it } from 'vitest'
import { makeTag } from '../../testing/zenmoneyTestData'
import { buildTagStructure, getTagName } from './project'

describe('buildTagStructure', () => {
  it('derives names, colors, unique names, and child ids from raw tags', () => {
    const result = buildTagStructure({
      tags: {
        parent: makeTag({
          id: 'parent',
          title: '🍔 Food',
          color: 0xff8800,
        }),
        child: makeTag({
          id: 'child',
          title: '🍔 Food',
          parent: 'parent',
        }),
      },
      extraTags: {
        null: makeTag({ id: 'null', title: 'No category', user: 0 }),
      },
    })

    expect(result.parent).toMatchObject({
      name: 'Food',
      uniqueName: 'Food',
      children: ['child'],
      colorHex: '#ff8800',
    })
    expect(result.parent).not.toHaveProperty('colorDisplay')
    expect(result.child).toMatchObject({
      name: 'Food',
      uniqueName: 'Food / Food',
      children: [],
    })
    expect(result.null).toMatchObject({ name: 'No category', children: [] })
  })

  it('keeps titles without a leading emoji intact', () => {
    expect(getTagName('Groceries')).toBe('Groceries')
  })
})

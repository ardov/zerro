import { describe, expect, it } from 'vitest'
import { makeStore, makeTag } from '../../testing/zenmoneyTestData'
import { getTag, getTags } from './read'

describe('zenmoney tag reads', () => {
  it('reads tags by map and id', () => {
    const food = makeTag({ id: 'food', title: 'Food' })
    const data = makeStore({
      tag: {
        food,
      },
    })

    expect(getTags(data)).toBe(data.tag)
    expect(getTag(data, 'food')).toBe(food)
    expect(getTag(data, 'missing')).toBeNull()
  })
})

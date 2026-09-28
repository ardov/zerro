import { describe, expect, it } from 'vitest'
import {
  applyCategoryAction,
  categoryChoices,
  commonCategories,
  type Category,
  type CategoryChoicesOptions,
} from './model'

describe('ordered category editing', () => {
  it.each([
    [
      [
        ['food', 'trip'],
        ['food', 'trip'],
      ],
      { value: ['food', 'trip'], mixed: false },
    ],
    [
      [
        ['food', 'trip'],
        ['food', 'work'],
      ],
      { value: ['food'], mixed: true },
    ],
    [[['food'], ['food', 'trip']], { value: ['food'], mixed: true }],
    [[['food'], ['travel']], { value: [], mixed: true }],
    [[[], []], { value: [], mixed: false }],
    [
      [
        ['food', 'trip', 'work'],
        ['food', 'other', 'work'],
      ],
      { value: ['food'], mixed: true },
    ],
  ])('shows only the common prefix of %j', (values, expected) => {
    expect(commonCategories(values as string[][])).toEqual(expected)
  })

  it('edits a common category without overwriting individual tails', () => {
    const values = [
      ['food', 'trip'],
      ['food', 'work'],
    ]
    const result = values.map(value =>
      applyCategoryAction(value, { type: 'replace', index: 0, id: 'cafe' })
    )
    expect(result).toEqual([
      ['cafe', 'trip'],
      ['cafe', 'work'],
    ])
    expect(values).toEqual([
      ['food', 'trip'],
      ['food', 'work'],
    ])
    expect(commonCategories(result)).toEqual({ value: ['cafe'], mixed: true })
  })

  it('replaces or removes an entire mixed tail', () => {
    const values = [
      ['food', 'trip'],
      ['food', 'work', 'other'],
    ]
    expect(
      values.map(value =>
        applyCategoryAction(value, {
          type: 'replaceTail',
          from: 1,
          id: 'holiday',
        })
      )
    ).toEqual([
      ['food', 'holiday'],
      ['food', 'holiday'],
    ])
    expect(
      values.map(value =>
        applyCategoryAction(value, { type: 'removeTail', from: 1 })
      )
    ).toEqual([['food'], ['food']])
    expect(
      applyCategoryAction(values[0], {
        type: 'replaceTail',
        from: 0,
        id: 'holiday',
      })
    ).toEqual(['holiday'])
  })

  it('keeps the first occurrence and promotes the next category on removal', () => {
    expect(
      applyCategoryAction(['food', 'trip', 'cafe'], {
        type: 'replace',
        index: 2,
        id: 'food',
      })
    ).toEqual(['food', 'trip'])
    expect(
      applyCategoryAction(['food', 'trip'], {
        type: 'replace',
        index: 0,
        id: 'trip',
      })
    ).toEqual(['trip'])
    expect(
      applyCategoryAction(['food', 'trip'], { type: 'remove', index: 0 })
    ).toEqual(['trip'])
    expect(
      applyCategoryAction(['food'], { type: 'append', id: 'food' })
    ).toEqual(['food'])
    expect(applyCategoryAction([], { type: 'append', id: 'food' })).toEqual([
      'food',
    ])
  })
})

describe('category choices', () => {
  const categories: Category[] = [
    { id: 'food', name: 'Food', title: 'Food', showOutcome: true },
    {
      id: 'cafe',
      parent: 'food',
      name: 'Cafe',
      title: 'Food / Cafe',
      showOutcome: true,
    },
    { id: 'income', name: 'Income', title: 'Income', showIncome: true },
    {
      id: 'gift',
      parent: 'income',
      name: 'Gift',
      title: 'Income / Gift',
      showIncome: true,
    },
    {
      id: 'salary',
      parent: 'income',
      name: 'Salary',
      title: 'Income / Salary',
      showIncome: true,
    },
    { id: 'null', name: 'Uncategorized', title: 'Uncategorized' },
  ]
  const ids = (options: CategoryChoicesOptions) =>
    categoryChoices(categories, options).choices.map(
      ({ category }) => category.id
    )

  it('keeps the selected category and ancestors outside the preferred type without siblings', () => {
    expect(ids({ value: 'gift', preferredType: 'outcome' })).toEqual([
      'food',
      'cafe',
      'income',
      'gift',
    ])
  })
  it('restores excluded parents as selectable context, while hiding excluded leaves', () => {
    const result = categoryChoices(categories, {
      preferredType: 'outcome',
      excludeIds: ['food'],
    })
    expect(
      result.choices.map(({ category, indent }) => [category.id, indent])
    ).toEqual([
      ['food', 0],
      ['cafe', 1],
    ])
    expect(ids({ preferredType: 'outcome', excludeIds: ['cafe'] })).toEqual([
      'food',
    ])
  })
  it('includes uncategorized only when requested, pins it first, and searches it consistently', () => {
    const options = { includeUncategorized: true }
    expect(categoryChoices(categories, options).choices[0].category.id).toBe(
      'null'
    )
    expect(ids({})).not.toContain('null')
    expect(ids({ ...options, query: '  UNCATEGORIZED ' })).toEqual(['null'])
    expect(ids({ ...options, query: 'gift' })).toEqual(['income', 'gift'])
    expect(ids({ ...options, excludeIds: ['null'] })).not.toContain('null')
  })

  it('offers expansion only when it adds an eligible category', () => {
    const options = { preferredType: 'outcome' as const }
    expect(categoryChoices(categories, options).hasMore).toBe(true)
    expect(
      categoryChoices(categories, { ...options, showAll: true }).hasMore
    ).toBe(false)
    expect(
      categoryChoices(categories, { ...options, query: 'gift' }).hasMore
    ).toBe(false)
    expect(
      categoryChoices(categories, {
        ...options,
        value: 'gift',
        excludeIds: ['income', 'salary'],
      }).hasMore
    ).toBe(false)
    expect(categoryChoices(categories, {}).hasMore).toBe(false)
  })
  it('searches across preferences and preserves hierarchy and exclusions', () => {
    expect(ids({ preferredType: 'outcome', query: 'gift' })).toEqual([
      'income',
      'gift',
    ])
    expect(
      ids({ preferredType: 'outcome', query: 'gift', excludeIds: ['gift'] })
    ).toEqual([])
    expect(ids({ preferredType: 'outcome', query: 'missing' })).toEqual([])
    expect(ids({ preferredType: 'outcome', showAll: true })).toContain('salary')
    expect(ids({ showAll: true })).not.toContain('null')
  })
})

import { describe, expect, it } from 'vitest'
import { accountChoices } from './model'
const accounts = [
  { id: 'cash', title: 'Cash', archive: false, fxCode: 'EUR' },
  { id: 'old', title: 'Old bank', archive: true, fxCode: 'USD' },
  { id: 'card', title: 'Card', archive: false, fxCode: 'USD' },
]
describe('account choices', () => {
  it('hides service accounts in browse, expansion and search unless selected', () => {
    const service = {
      id: 'service',
      title: 'Zerro Data',
      archive: true,
      fxCode: 'EUR',
      isService: true,
    }
    for (const options of [{}, { expanded: true }, { query: 'Zerro' }]) {
      expect(accountChoices([service], options)).toEqual({
        items: [],
        hasMore: false,
      })
      expect(
        accountChoices([service], { ...options, selectedIds: ['service'] })
      ).toEqual({ items: [service], hasMore: false })
    }
    expect(
      accountChoices([service], {
        selectedIds: ['service'],
        excludeIds: ['service'],
      }).items
    ).toEqual([])
  })
  it('keeps source order and exposes archive expansion only when needed', () => {
    expect(accountChoices(accounts)).toEqual({
      items: [accounts[0], accounts[2]],
      hasMore: true,
    })
    expect(accountChoices(accounts, { expanded: true })).toEqual({
      items: accounts,
      hasMore: false,
    })
  })
  it('keeps selected archived accounts visible in single and multiple selection', () => {
    expect(accountChoices(accounts, { selectedIds: ['old'] })).toEqual({
      items: accounts,
      hasMore: false,
    })
    expect(
      accountChoices(accounts, { selectedIds: ['old', 'cash'] }).items
    ).toEqual(accounts)
  })
  it('searches names and currencies including archived accounts', () => {
    expect(accountChoices(accounts, { query: ' OLD ' })).toEqual({
      items: [accounts[1]],
      hasMore: false,
    })
    expect(accountChoices(accounts, { query: 'usd' }).items).toEqual(
      accounts.slice(1)
    )
  })
  it.each([{}, { expanded: true }, { query: 'old' }, { selectedIds: ['old'] }])(
    'keeps exclusions absolute with %j',
    options => {
      const result = accountChoices(accounts, {
        ...options,
        excludeIds: ['old'],
      })
      expect(result.items.map(item => item.id)).not.toContain('old')
      expect(result.hasMore).toBe(false)
    }
  )
})

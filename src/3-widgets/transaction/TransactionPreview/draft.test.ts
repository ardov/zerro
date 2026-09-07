import { describe, expect, it } from 'vitest'
import { makeTransaction } from '@/zerro-core/support/testing/zenmoneyTestData'
import type { TAccountId } from '@/6-shared/types'
import type { TDraftContext } from './draft'
import {
  changedFields,
  draftCreated,
  draftIssues,
  emptyDraft,
  newMerchantTitle,
  setDraftMerchant,
  setDraftType,
  setTransferAccount,
  setTransferAmount,
  swapTransferSides,
  toDraft,
  toLegs,
  staleRates,
  toPatch,
} from './draft'

/** Two roubles accounts, one euro account, and a debt account. */
const instruments: Record<string, number> = {
  card: 1,
  cash: 1,
  euro: 2,
  debt: 1,
}

const ctx: TDraftContext = {
  accountIds: ['card', 'cash', 'euro'],
  instrumentOf: (id: TAccountId) => instruments[id],
  debtAccountId: 'debt',
}

const expense = makeTransaction({
  id: 'tr',
  outcomeAccount: 'card',
  incomeAccount: 'card',
  outcome: 100,
  income: 0,
  tag: ['food'],
  created: +new Date(2026, 0, 10, 18, 56),
  date: '2026-01-10',
})

describe('emptyDraft', () => {
  it('starts a transaction from nothing, with no source to read', () => {
    const at = +new Date(2026, 4, 17, 14, 30)
    expect(emptyDraft(ctx, at)).toMatchObject({
      type: 'outcome',
      account: 'card',
      amount: 0,
      fromAccount: 'card',
      toAccount: 'cash',
      tag: null,
      payee: null,
      date: '2026-05-17',
      time: '14:30',
    })
  })

  it('is worth a transaction as soon as it has an amount', () => {
    const draft = { ...emptyDraft(ctx, Date.now()), amount: 250 }
    expect(draftIssues(draft)).toEqual({})
    expect(toPatch(draft, ctx)).toMatchObject({
      outcomeAccount: 'card',
      outcome: 250,
      income: 0,
    })
  })
})

describe('toDraft', () => {
  it('reads an expense, and offers a second account for a transfer', () => {
    const draft = toDraft(expense, ctx)
    expect(draft).toMatchObject({
      type: 'outcome',
      account: 'card',
      amount: 100,
      fromAccount: 'card',
      toAccount: 'cash',
      tag: ['food'],
      time: '18:56',
    })
  })

  it('reads a transfer from its two legs', () => {
    const tr = makeTransaction({
      outcomeAccount: 'card',
      outcome: 100,
      incomeAccount: 'euro',
      incomeInstrument: 2,
      income: 1,
    })
    expect(toDraft(tr, ctx)).toMatchObject({
      type: 'transfer',
      fromAccount: 'card',
      fromAmount: 100,
      toAccount: 'euro',
      toAmount: 1,
    })
  })

  it('reads a debt from the side the debt account is not on', () => {
    const lent = makeTransaction({
      outcomeAccount: 'card',
      outcome: 500,
      incomeAccount: 'debt',
      income: 500,
    })
    expect(toDraft(lent, ctx)).toMatchObject({
      type: 'outcomeDebt',
      account: 'card',
      amount: 500,
    })

    const borrowed = makeTransaction({
      outcomeAccount: 'debt',
      outcome: 500,
      incomeAccount: 'cash',
      income: 500,
    })
    expect(toDraft(borrowed, ctx)).toMatchObject({
      type: 'incomeDebt',
      account: 'cash',
      amount: 500,
    })
  })
})

describe('setDraftType', () => {
  it('keeps the category through a transfer and back', () => {
    const draft = toDraft(expense, ctx)
    const transfer = setDraftType(draft, 'transfer', ctx)
    expect(transfer.tag).toEqual(['food'])
    const back = setDraftType(transfer, 'outcome', ctx)
    expect(back).toMatchObject({ tag: ['food'], account: 'card', amount: 100 })
  })

  it('seeds a transfer from the account being edited', () => {
    const transfer = setDraftType(toDraft(expense, ctx), 'transfer', ctx)
    expect(transfer).toMatchObject({
      fromAccount: 'card',
      toAccount: 'cash',
      fromAmount: 100,
      toAmount: 100,
    })
  })

  it('does not mirror the amount across currencies', () => {
    const draft = { ...toDraft(expense, ctx), toAccount: 'euro', toAmount: 3 }
    expect(setDraftType(draft, 'transfer', ctx)).toMatchObject({
      fromAmount: 100,
      toAmount: 3,
    })
  })

  it('leaves a transfer by the side the new type is about', () => {
    const transfer = {
      ...toDraft(expense, ctx),
      type: 'transfer' as const,
      fromAccount: 'card',
      toAccount: 'euro',
      fromAmount: 100,
      toAmount: 1,
    }
    expect(setDraftType(transfer, 'income', ctx)).toMatchObject({
      account: 'euro',
      amount: 1,
    })
    expect(setDraftType(transfer, 'outcome', ctx)).toMatchObject({
      account: 'card',
      amount: 100,
    })
  })

  it('restores the transfer that was left', () => {
    const transfer = setDraftType(toDraft(expense, ctx), 'transfer', ctx)
    const income = setDraftType(transfer, 'income', ctx)
    expect(setDraftType(income, 'transfer', ctx)).toMatchObject({
      fromAccount: 'cash',
      toAccount: 'card',
    })
  })
})

describe('transfer editing', () => {
  const transfer = setDraftType(toDraft(expense, ctx), 'transfer', ctx)

  it('follows the other side in one currency', () => {
    expect(setTransferAmount(transfer, 'from', 250, ctx)).toMatchObject({
      fromAmount: 250,
      toAmount: 250,
    })
    expect(setTransferAmount(transfer, 'to', 250, ctx)).toMatchObject({
      fromAmount: 250,
      toAmount: 250,
    })
  })

  it('leaves the other side alone across currencies', () => {
    const cross = setTransferAccount(transfer, 'to', 'euro', ctx)
    expect(setTransferAmount(cross, 'from', 250, ctx)).toMatchObject({
      fromAmount: 250,
      toAmount: 100,
    })
  })

  it('swaps rather than putting one account on both ends', () => {
    const swapped = setTransferAccount(transfer, 'to', 'card', ctx)
    expect(swapped).toMatchObject({ fromAccount: 'cash', toAccount: 'card' })
  })

  it('turns the transfer around with its amounts', () => {
    const cross = setTransferAccount(transfer, 'to', 'euro', ctx)
    const uneven = setTransferAmount(cross, 'to', 1, ctx)
    expect(swapTransferSides(uneven)).toMatchObject({
      fromAccount: 'euro',
      fromAmount: 1,
      toAccount: 'card',
      toAmount: 100,
    })
  })
})

describe('toLegs', () => {
  const draft = toDraft(expense, ctx)

  it('pays an expense from the account to itself', () => {
    expect(toLegs(draft, ctx)).toEqual({
      outcomeAccount: 'card',
      outcomeInstrument: 1,
      outcome: 100,
      incomeAccount: 'card',
      incomeInstrument: 1,
      income: 0,
    })
  })

  it('turns an expense into an income by moving the amount over', () => {
    expect(toLegs(setDraftType(draft, 'income', ctx), ctx)).toMatchObject({
      outcome: 0,
      income: 100,
    })
  })

  it('puts the debt account on the far end of a debt', () => {
    expect(toLegs(setDraftType(draft, 'outcomeDebt', ctx), ctx)).toEqual({
      outcomeAccount: 'card',
      outcomeInstrument: 1,
      outcome: 100,
      incomeAccount: 'debt',
      incomeInstrument: 1,
      income: 100,
    })
    expect(toLegs(setDraftType(draft, 'incomeDebt', ctx), ctx)).toMatchObject({
      outcomeAccount: 'debt',
      incomeAccount: 'card',
    })
  })

  it('has nothing to build without a debt account', () => {
    const without = { ...ctx, debtAccountId: undefined }
    expect(
      toLegs(setDraftType(draft, 'incomeDebt', without), without)
    ).toBeNull()
  })
})

describe('toPatch', () => {
  it('drops the categories a transfer cannot carry, keeping the draft whole', () => {
    const transfer = setDraftType(toDraft(expense, ctx), 'transfer', ctx)
    expect(transfer.tag).toEqual(['food'])
    expect(toPatch(transfer, ctx)?.tag).toBeNull()
  })

  it('trims a payee down to nothing', () => {
    const draft = { ...toDraft(expense, ctx), payee: '   ' }
    expect(toPatch(draft, ctx)?.payee).toBeNull()
  })

  it('claims the merchant it names, and nobody when it names none', () => {
    const draft = toDraft(expense, ctx)
    expect(
      toPatch(setDraftMerchant(draft, { id: 'm1', title: 'Shop' }), ctx)
    ).toMatchObject({ merchant: 'm1', payee: 'Shop' })
    expect(toPatch(setDraftMerchant(draft, null), ctx)).toMatchObject({
      merchant: null,
      payee: null,
    })
  })

  it('leaves the merchant out while it is still only a title', () => {
    const draft = setDraftMerchant(toDraft(expense, ctx), { title: 'Kiosk' })
    const patch = toPatch(draft, ctx)!

    expect('merchant' in patch).toBe(false)
    expect(patch.payee).toBe('Kiosk')
    expect(newMerchantTitle(draft)).toBe('Kiosk')
  })

  it('names nobody when the name is blank', () => {
    const draft = setDraftMerchant(toDraft(expense, ctx), { title: '  ' })
    expect(toPatch(draft, ctx)).toMatchObject({ merchant: null, payee: null })
    expect(newMerchantTitle(draft)).toBeNull()
  })

  it('has no new merchant to create when it names an existing one', () => {
    const draft = toDraft(expense, ctx)
    expect(newMerchantTitle(draft)).toBeNull()
    expect(
      newMerchantTitle(setDraftMerchant(draft, { id: 'm1', title: 'Shop' }))
    ).toBeNull()
  })
})

describe('staleRates', () => {
  const abroad = makeTransaction({
    ...expense,
    opOutcome: 3,
    opOutcomeInstrument: 2,
  })

  it('keeps the rate of a leg that has not moved', () => {
    const legs = toLegs(toDraft(abroad, ctx), ctx)!
    expect(staleRates(legs, abroad)).toEqual({})
  })

  it('forgets the rate of a leg it moved', () => {
    const retyped = { ...toDraft(abroad, ctx), amount: 120 }
    expect(staleRates(toLegs(retyped, ctx)!, abroad)).toEqual({
      opOutcome: null,
      opOutcomeInstrument: null,
    })
  })
})

describe('changedFields', () => {
  it('reports only what moved', () => {
    const draft = toDraft(expense, ctx)
    expect(changedFields(expense, toPatch(draft, ctx)!)).toEqual({})
    const edited = { ...draft, comment: 'lunch' }
    expect(changedFields(expense, toPatch(edited, ctx)!)).toEqual({
      comment: 'lunch',
    })
  })

  it('compares category lists by their contents', () => {
    const draft = { ...toDraft(expense, ctx), tag: ['food'] }
    expect(changedFields(expense, toPatch(draft, ctx)!)).toEqual({})
  })
})

describe('draftIssues', () => {
  const draft = toDraft(expense, ctx)

  it('finds nothing wrong with a whole expense', () => {
    expect(draftIssues(draft)).toEqual({})
  })

  it('marks the amount when there is none', () => {
    expect(draftIssues({ ...draft, amount: 0 })).toEqual({ amount: 'amount' })
  })

  it('marks both ends of a transfer to the account it came from', () => {
    const transfer = setDraftType(draft, 'transfer', ctx)
    expect(
      draftIssues({ ...transfer, toAccount: transfer.fromAccount })
    ).toMatchObject({ fromAccount: 'sameAccount', toAccount: 'sameAccount' })
  })

  it('marks the side of a transfer that is empty, not both', () => {
    const transfer = setDraftType(draft, 'transfer', ctx)
    expect(draftIssues({ ...transfer, toAmount: 0 })).toEqual({
      toAmount: 'amount',
    })
  })

  it('marks a debt that says nobody owes it', () => {
    const lent = setDraftType(draft, 'outcomeDebt', ctx)
    expect(draftIssues(lent)).toEqual({ payee: 'debtor' })
    expect(draftIssues({ ...lent, payee: 'Alex' })).toEqual({})
    // A picked merchant is a debtor too, even with no text beside it.
    expect(draftIssues({ ...lent, merchant: { id: 'm1' } })).toEqual({})
    // So is one that only has a name yet: the save creates it.
    expect(draftIssues({ ...lent, merchant: { title: 'Alex' } })).toEqual({})
  })

  it('asks no debtor of anything that is not a debt', () => {
    expect(draftIssues({ ...draft, payee: null })).toEqual({})
  })
})

describe('draftCreated', () => {
  it('reads the time against the date being saved', () => {
    const draft = {
      ...toDraft(expense, ctx),
      date: '2026-02-01' as const,
      time: '09:05',
    }
    expect(new Date(draftCreated(draft, expense.created))).toEqual(
      new Date(2026, 1, 1, 9, 5, 0, 0)
    )
  })

  it('keeps the original moment when the time is not one', () => {
    const draft = { ...toDraft(expense, ctx), time: '' }
    expect(draftCreated(draft, expense.created)).toBe(expense.created)
  })
})

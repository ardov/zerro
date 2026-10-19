import { expect, it } from 'vitest'
import { makeDemoStore } from '../../support/demo'
import { makeTestRootState } from '@/store/testing'
import {
  makeMerchant,
  makeTransaction,
} from '../../support/testing/zenmoneyTestData'
import { selectOptions } from './debtors'
import { compileQuery, selectQueryContext } from './transactions'

it('keeps historical debtor options and refreshes matching live transactions', () => {
  const data = makeDemoStore({ now: Date.parse('2026-05-15T12:00:00Z') })
  data.merchant = { alex: makeMerchant({ id: 'alex', title: 'Alex' }) }
  const loan = makeTransaction({
    id: 'loan',
    income: 100,
    outcome: 100,
    incomeInstrument: 1,
    outcomeInstrument: 1,
    incomeAccount: 'Debts',
    outcomeAccount: 'Cash USD',
    merchant: 'alex',
  })
  const repayment = {
    ...loan,
    id: 'repayment',
    merchant: null,
    payee: 'Alex!',
    incomeAccount: 'Cash USD',
    outcomeAccount: 'Debts',
  }
  data.transaction = {
    loan,
    repayment,
    deleted: {
      ...loan,
      id: 'deleted',
      merchant: null,
      payee: 'Bob',
      deleted: true,
    },
  }
  const first = selectOptions(makeTestRootState(data))
  expect(first).toEqual({ alex: 'Alex', bob: 'Bob' })
  expect(
    selectOptions(
      makeTestRootState({ ...data, reminderMarker: { ...data.reminderMarker } })
    )
  ).toBe(first)
  const query = {
    clauses: [
      { kind: 'debtor' as const, ids: ['alex'] },
      { kind: 'amount' as const, currencies: ['USD'] },
    ],
  }
  const matches = (snapshot: typeof data) =>
    Object.values(snapshot.transaction)
      .filter(
        compileQuery(query, selectQueryContext(makeTestRootState(snapshot)))
      )
      .map(t => t.id)
  expect(matches(data)).toEqual(['loan', 'repayment'])
  const changed = {
    ...data,
    transaction: {
      ...data.transaction,
      loan: { ...loan, merchant: null, payee: 'Carol' },
      added: { ...loan, id: 'added' },
    },
  }
  expect(selectOptions(makeTestRootState(changed))).toEqual({
    carol: 'Carol',
    alex: 'Alex',
    bob: 'Bob',
  })
  expect(matches(changed)).toEqual(['repayment', 'added'])
  const renamed = {
    ...data,
    merchant: { alex: { ...data.merchant.alex, title: 'Daniel' } },
  }
  expect(selectOptions(makeTestRootState(renamed))).toEqual({
    daniel: 'Daniel',
    alex: 'Alex!',
    bob: 'Bob',
  })
  expect(matches(renamed)).toEqual(['repayment'])
})

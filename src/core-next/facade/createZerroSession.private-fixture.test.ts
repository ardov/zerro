import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import type { RootState } from 'store'
import { i18n } from '6-shared/localization'
import { createZerroSession } from './createZerroSession'

vi.mock('5-entities/shared/hidden-store/dataAccount', () => ({
  DATA_ACC_NAME: '🤖 [Zerro Data]',
  getDataAccountId: () => undefined,
  prepareDataAccount: () => {
    throw new Error('prepareDataAccount is not available in fixture tests')
  },
}))

const fixturePath = process.env.PRIVATE_FIXTURE
const maybeDescribe = fixturePath ? describe : describe.skip

type PrivateFixture = {
  manifest: {
    locale?: string
  }
  input: {
    data: RootState['data']['current']
  }
}

maybeDescribe('core-next session reads on private fixture', () => {
  it('match the current core Redux adapter selectors', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-06T12:00:00.000Z'))

    try {
      const fixture = readFixture(fixturePath!)
      const state = makeRootState(fixture.input.data)

      await i18n.changeLanguage(fixture.manifest.locale || 'ru')

      const {
        selectCoreActivity,
        selectCoreBalances,
        selectCoreBalancesByDate,
        selectCoreBudgets,
        selectCoreCurrentFunds,
        selectCoreCurrentFxRates,
        selectCoreDebtors,
        selectCoreEnvelopes,
        selectCoreEnvelopeStructure,
        selectCoreEnvMetrics,
        selectCoreFxRates,
        selectCoreGoalTotals,
        selectCoreGoals,
        selectCoreHistoryStart,
        selectCoreKeepingEnvelopeIds,
        selectCoreMonthList,
        selectCoreMonthTotals,
        selectCoreRawActivity,
        selectCoreRawGoals,
        selectCoreDomainEnvelopes,
        selectCoreDomainEnvelopeStructure,
        selectCoreSortedActivity,
        selectCoreUserSettings,
      } = await import('../adapters/redux/selectors')

      const session = createZerroSession(fixture.input.data, {
        now: () => Date.now(),
        uuid: () => 'private-fixture-session-test',
      })

      expectSameJsonHash(
        'userSettings',
        session.settings.get(),
        selectCoreUserSettings(state)
      )
      expectSameJsonHash(
        'debtors',
        session.debtors.getAll(),
        selectCoreDebtors(state)
      )
      expectSameJsonHash(
        'envelopes',
        session.envelopes.getAll(),
        selectCoreDomainEnvelopes(state)
      )
      expectSameJsonHash(
        'envelopeStructure',
        session.envelopes.getStructure(),
        selectCoreDomainEnvelopeStructure(state)
      )
      expectSameJsonHash(
        'keepingEnvelopeIds',
        session.envelopes.getKeepingIds(),
        selectCoreKeepingEnvelopeIds(state)
      )
      expectSameJsonHash(
        'budgets',
        session.budgets.getAll(),
        selectCoreBudgets(state)
      )
      expectSameJsonHash(
        'currentFunds',
        session.accounts.getCurrentFunds(),
        selectCoreCurrentFunds(state)
      )
      expectSameJsonHash(
        'currentFxRates',
        session.fx.getCurrentRates(),
        selectCoreCurrentFxRates(state)
      )
      expectSameJsonHash(
        'fxRates',
        session.fx.getRates(),
        selectCoreFxRates(state)
      )
      expectSameJsonHash(
        'rawActivity',
        session.read.rawActivity(),
        selectCoreRawActivity(state)
      )
      expectSameJsonHash(
        'activity',
        session.activity.getAll(),
        selectCoreActivity(state)
      )
      expectSameJsonHash(
        'monthList',
        session.months.getList(),
        selectCoreMonthList(state)
      )
      expectSameJsonHash(
        'envMetrics',
        session.envelopes.getMetrics(),
        selectCoreEnvMetrics(state)
      )
      expectSameJsonHash(
        'sortedActivity',
        session.activity.getSorted(),
        selectCoreSortedActivity(state)
      )
      expectSameJsonHash(
        'monthTotals',
        session.months.getTotals(),
        selectCoreMonthTotals(state)
      )
      expectSameJsonHash(
        'rawGoals',
        session.read.rawGoals(),
        selectCoreRawGoals(state)
      )
      expectSameJsonHash(
        'goals',
        session.goals.getAll(),
        selectCoreGoals(state)
      )
      expectSameJsonHash(
        'goalTotals',
        session.goals.getTotals(),
        selectCoreGoalTotals(state)
      )
      expectSameJsonHash(
        'historyStart',
        session.transactions.getHistoryStart(),
        selectCoreHistoryStart(state)
      )
      expectSameJsonHash(
        'balances',
        session.balances.getAll(),
        selectCoreBalances(state)
      )
      expectSameJsonHash(
        'balancesByDate',
        session.balances.getByDate(),
        selectCoreBalancesByDate(state)
      )
    } finally {
      vi.useRealTimers()
    }
  }, 60_000)
})

function readFixture(filePath: string): PrivateFixture {
  const resolvedPath = path.resolve(process.cwd(), filePath)
  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8')) as PrivateFixture
}

function makeRootState(data: RootState['data']['current']): RootState {
  return {
    data: {
      current: data,
      base: data,
    },
    displayCurrency: null,
    isPending: false,
    lastSync: {
      finishedAt: 0,
      isSuccessful: null,
      errorMessage: null,
    },
    token: null,
  }
}

function expectSameJsonHash(name: string, actual: unknown, expected: unknown) {
  expect(
    hashJson(actual),
    `${name}: ${summarizeMismatch(actual, expected)}`
  ).toBe(hashJson(expected))
}

function hashJson(value: unknown) {
  return crypto
    .createHash('sha256')
    .update(stableStringify(value))
    .digest('hex')
}

function stableStringify(value: unknown): string {
  if (typeof value === 'undefined') return 'undefined'
  if (value === null || typeof value !== 'object') return JSON.stringify(value)

  if (Array.isArray(value)) {
    return `[${value
      .map(item =>
        typeof item === 'undefined' ? 'null' : stableStringify(item)
      )
      .join(',')}]`
  }

  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .filter(key => typeof record[key] !== 'undefined')
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`
}

function summarizeMismatch(actual: unknown, expected: unknown) {
  if (!isPlainObject(actual) || !isPlainObject(expected)) {
    return `actual=${describeValue(actual)}, expected=${describeValue(expected)}`
  }

  const actualKeys = Object.keys(actual)
  const expectedKeys = Object.keys(expected)
  const actualSet = new Set(actualKeys)
  const expectedSet = new Set(expectedKeys)
  const sharedKeys = actualKeys.filter(key => expectedSet.has(key))
  const changedKeys = sharedKeys.filter(
    key => hashJson(actual[key]) !== hashJson(expected[key])
  )

  return JSON.stringify({
    actualKeys: actualKeys.length,
    expectedKeys: expectedKeys.length,
    missingKeys: expectedKeys.filter(key => !actualSet.has(key)).length,
    extraKeys: actualKeys.filter(key => !expectedSet.has(key)).length,
    changedKeys: changedKeys.length,
    changedFields: countChangedFields(actual, expected, changedKeys),
  })
}

function countChangedFields(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
  changedKeys: string[]
) {
  const counts: Record<string, number> = {}

  changedKeys.forEach(key => {
    const actualNode = actual[key]
    const expectedNode = expected[key]
    if (!isPlainObject(actualNode) || !isPlainObject(expectedNode)) {
      counts['<node>'] = (counts['<node>'] || 0) + 1
      return
    }

    const fields = new Set([
      ...Object.keys(actualNode),
      ...Object.keys(expectedNode),
    ])

    fields.forEach(field => {
      if (hashJson(actualNode[field]) === hashJson(expectedNode[field])) return
      counts[field] = (counts[field] || 0) + 1
    })
  })

  return counts
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  return true
}

function describeValue(value: unknown) {
  if (Array.isArray(value)) return `array(${value.length})`
  if (isPlainObject(value)) return `object(${Object.keys(value).length})`
  return typeof value
}

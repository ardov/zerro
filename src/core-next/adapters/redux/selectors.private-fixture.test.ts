import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import type { RootState } from 'store'
import { i18n } from '6-shared/localization'

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

maybeDescribe('core-next Redux adapter selectors on private fixture', () => {
  it('match current legacy selectors', async () => {
    const fixture = readFixture(fixturePath!)
    const state = makeRootState(fixture.input.data)

    await i18n.changeLanguage(fixture.manifest.locale || 'ru')

    const [
      { budgetModel },
      { envelopeModel },
      { userSettingsModel },
      {
        selectCoreBudgets,
        selectCoreEnvelopes,
        selectCoreEnvelopeStructure,
        selectCoreKeepingEnvelopeIds,
        selectCoreRawActivity,
        selectCoreUserSettings,
      },
      { getRawActivity },
    ] = await Promise.all([
      import('5-entities/budget'),
      import('5-entities/envelope'),
      import('5-entities/userSettings'),
      import('./selectors'),
      import('5-entities/envBalances/1 - rawActivity'),
    ])

    expectSameJsonHash(
      'userSettings',
      selectCoreUserSettings(state),
      userSettingsModel.get(state)
    )
    expectSameJsonHash(
      'envelopes',
      selectCoreEnvelopes(state),
      envelopeModel.getEnvelopes(state)
    )
    expectSameJsonHash(
      'envelopeStructure',
      selectCoreEnvelopeStructure(state),
      envelopeModel.getEnvelopeStructure(state)
    )
    expectSameJsonHash(
      'keepingEnvelopeIds',
      selectCoreKeepingEnvelopeIds(state),
      envelopeModel.getKeepingEnvelopes(state)
    )
    expectSameJsonHash('budgets', selectCoreBudgets(state), budgetModel.get(state))
    expectSameJsonHash(
      'rawActivity',
      selectCoreRawActivity(state),
      getRawActivity(state)
    )
  })
})

function readFixture(filePath: string): PrivateFixture {
  const resolvedPath = path.resolve(process.cwd(), filePath)
  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8')) as PrivateFixture
}

function makeRootState(data: RootState['data']['current']): RootState {
  return {
    data: {
      current: data,
      server: data,
      diff: undefined,
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

function hashJson(value: unknown) {
  return crypto
    .createHash('sha256')
    .update(stableStringify(value))
    .digest('hex')
}

function expectSameJsonHash(name: string, actual: unknown, expected: unknown) {
  expect(
    hashJson(actual),
    `${name}: ${summarizeMismatch(actual, expected)}`
  ).toBe(hashJson(expected))
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
      if (hashJson(actualNode[field]) !== hashJson(expectedNode[field])) {
        counts[field] = (counts[field] || 0) + 1
      }
    })
  })

  return counts
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function describeValue(value: unknown) {
  if (Array.isArray(value)) return `array(${value.length})`
  if (isPlainObject(value)) return `object(${Object.keys(value).length})`
  return typeof value
}

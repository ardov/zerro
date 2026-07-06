import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import type { RootState } from 'store'
import { i18n } from '6-shared/localization'
import {
  buildBudgets,
  buildEnvelopes,
  buildStructure,
  defaultEnvelopeGroupIds,
  flattenStructure,
  getEnvBudgets,
  getEnvelopeMeta as getCoreEnvelopeMeta,
  getUserSettings as getCoreUserSettings,
  TEnvelope,
  TGroupNode,
} from './index'

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

maybeDescribe('core-next Zerro readers on private fixture', () => {
  it('match the current legacy readers', async () => {
    const fixture = readFixture(fixturePath!)
    const state = makeRootState(fixture.input.data)
    const [{ userSettingsModel }, { getEnvelopeMeta }] = await Promise.all([
      import('5-entities/userSettings'),
      import('5-entities/envelope/shared/metaData'),
    ])

    expectSameJsonHash(
      'userSettings',
      getCoreUserSettings(fixture.input.data),
      userSettingsModel.get(state)
    )
    expectSameJsonHash(
      'envelopeMeta',
      getCoreEnvelopeMeta(fixture.input.data),
      getEnvelopeMeta(state)
    )
  })

  it('builds envelopes matching the current legacy selector', async () => {
    const fixture = readFixture(fixturePath!)
    const state = makeRootState(fixture.input.data)

    await i18n.changeLanguage(fixture.manifest.locale || 'ru')

    const [
      { accountModel },
      { debtorModel },
      { envelopeModel },
      { tagModel },
      { userModel },
    ] = await Promise.all([
      import('5-entities/account'),
      import('5-entities/debtors'),
      import('5-entities/envelope'),
      import('5-entities/tag'),
      import('5-entities/user'),
    ])

    const actual = buildEnvelopes({
      debtors: debtorModel.getDebtors(state),
      populatedTags: tagModel.getPopulatedTags(state),
      savingAccounts: accountModel.getSavingAccounts(state),
      envelopeMeta: getCoreEnvelopeMeta(fixture.input.data),
      userCurrency: userModel.getUserCurrency(state),
    })
    const localized = localizeDefaultEnvelopeGroups(actual, {
      defaultTagGroup: i18n.t('defaultTagGroup', { ns: 'common' }),
      defaultAccountGroup: i18n.t('defaultAccountGroup', { ns: 'common' }),
      defaultMerchantGroup: i18n.t('defaultMerchantGroup', { ns: 'common' }),
      defaultPayeeGroup: i18n.t('defaultPayeeGroup', { ns: 'common' }),
    })

    expectSameJsonHash(
      'envelopes',
      localized.byId,
      envelopeModel.getEnvelopes(state)
    )
    expectSameJsonHash(
      'envelopeStructure',
      localized.structure,
      envelopeModel.getEnvelopeStructure(state)
    )
  })

  it('builds budgets matching the current legacy selector', async () => {
    const fixture = readFixture(fixturePath!)
    const state = makeRootState(fixture.input.data)

    const [{ budgetModel }, { getTagBudgets }] = await Promise.all([
      import('5-entities/budget'),
      import('5-entities/budget/tagBudget'),
    ])

    const actual = buildBudgets({
      tagBudgets: getTagBudgets(state),
      envBudgets: getEnvBudgets(fixture.input.data),
      preferZmBudgets: getCoreUserSettings(fixture.input.data).preferZmBudgets,
    })

    expectSameJsonHash('budgets', actual, budgetModel.get(state))
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

function localizeDefaultEnvelopeGroups(
  compiled: { byId: Record<string, TEnvelope>; structure: TGroupNode[] },
  labels: {
    defaultTagGroup: string
    defaultAccountGroup: string
    defaultMerchantGroup: string
    defaultPayeeGroup: string
  }
) {
  const byId = Object.fromEntries(
    Object.entries(compiled.byId).map(([id, envelope]) => [
      id,
      {
        ...envelope,
        group: localizeGroup(envelope.group, labels),
      },
    ])
  )
  const structure = buildStructure(byId)

  flattenStructure(structure).forEach((node, index) => {
    if (node.type === 'group') return
    const envelope = byId[node.id]
    envelope.parent = node.parent
    envelope.group = node.group
    envelope.children = node.children.map(child => child.id)
    envelope.index = index
  })

  return {
    byId,
    structure,
  }
}

function localizeGroup(
  group: string,
  labels: {
    defaultTagGroup: string
    defaultAccountGroup: string
    defaultMerchantGroup: string
    defaultPayeeGroup: string
  }
): string {
  switch (group) {
    case defaultEnvelopeGroupIds.tags:
      return labels.defaultTagGroup
    case defaultEnvelopeGroupIds.accounts:
      return labels.defaultAccountGroup
    case defaultEnvelopeGroupIds.merchants:
      return labels.defaultMerchantGroup
    case defaultEnvelopeGroupIds.payees:
      return labels.defaultPayeeGroup
    default:
      return group
  }
}

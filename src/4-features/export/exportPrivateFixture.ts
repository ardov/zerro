import { formatDate } from '6-shared/helpers/date'
import { appVersion } from '6-shared/config'
import { i18n } from '6-shared/localization'
import type { RootState } from 'store'

type PrivateFixture = Awaited<ReturnType<typeof makePrivateFixture>>

export async function downloadPrivateFixture(
  state: RootState,
  fixtureName = 'private-fixture'
) {
  const fixture = await makePrivateFixture(state, fixtureName)
  const content = JSON.stringify(fixture, null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const href = window.URL.createObjectURL(blob)
  const fileName = makeFileName(fixtureName)

  const link = document.createElement('a')
  link.setAttribute('href', href)
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(href)

  return {
    fileName,
    summary: getFixtureSummary(fixture),
  }
}

export async function makePrivateFixture(
  state: RootState,
  fixtureName: string
) {
  const {
    selectCoreActivity,
    selectCoreBudgets,
    selectCoreEnvelopes,
    selectCoreEnvelopeStructure,
    selectCoreEnvMetrics,
    selectCoreKeepingEnvelopeIds,
    selectCoreMonthList,
    selectCoreMonthTotals,
    selectCoreRawActivity,
    selectCoreSortedActivity,
  } = await import('core-next/adapters/redux')

  return {
    schemaVersion: 2,
    manifest: {
      schemaVersion: 2,
      name: fixtureName,
      createdAt: new Date().toISOString(),
      appVersion,
      locale: i18n.resolvedLanguage || i18n.language,
      source: 'real-account-private',
      inputKind: 'normalized-current-data',
      outputs: [
        'monthList',
        'envelopes',
        'envelopeStructure',
        'keepingEnvelopeIds',
        'budgets',
        'rawActivity',
        'activity',
        'sortedActivity',
        'envMetrics',
        'monthTotals',
      ],
      notes: 'Private local fixture. Must not be committed.',
    },
    input: {
      schemaVersion: 1,
      data: state.data.current,
    },
    coreOutput: {
      schemaVersion: 2,
      outputs: {
        monthList: selectCoreMonthList(state),
        envelopes: selectCoreEnvelopes(state),
        envelopeStructure: selectCoreEnvelopeStructure(state),
        keepingEnvelopeIds: selectCoreKeepingEnvelopeIds(state),
        budgets: selectCoreBudgets(state),
        rawActivity: selectCoreRawActivity(state),
        activity: selectCoreActivity(state),
        sortedActivity: selectCoreSortedActivity(state),
        envMetrics: selectCoreEnvMetrics(state),
        monthTotals: selectCoreMonthTotals(state),
      },
    },
  }
}

function makeFileName(fixtureName: string) {
  const safeName = fixtureName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const name = safeName || 'private-fixture'
  const timestamp = formatDate(Date.now(), 'yyyyMMdd-HHmm')
  return `zerro-private-fixture-${name}-${timestamp}.json`
}

function getFixtureSummary(fixture: PrivateFixture) {
  const data = fixture.input.data

  return {
    accounts: Object.keys(data.account).length,
    budgets: Object.keys(data.budget).length,
    merchants: Object.keys(data.merchant).length,
    reminders: Object.keys(data.reminder).length,
    tags: Object.keys(data.tag).length,
    transactions: Object.keys(data.transaction).length,
    months: fixture.coreOutput.outputs.monthList.length,
    envelopes: Object.keys(fixture.coreOutput.outputs.envelopes).length,
  }
}

export type TPrivateFixture = PrivateFixture

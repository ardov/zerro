#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const fixturePath = process.argv[2]

if (!fixturePath) {
  console.error(
    [
      'Usage:',
      '  pnpm fixture:summary <path-to-private-fixture-json>',
      '',
      'Example:',
      '  pnpm fixture:summary private-fixtures/my-large-account/fixture.json',
    ].join('\n')
  )
  process.exit(1)
}

const resolvedPath = path.resolve(process.cwd(), fixturePath)

if (!fs.existsSync(resolvedPath)) {
  console.error(`Fixture file not found: ${resolvedPath}`)
  process.exit(1)
}

const stat = fs.statSync(resolvedPath)
const startedAt = Date.now()
const raw = fs.readFileSync(resolvedPath, 'utf8')
const fixture = JSON.parse(raw)
const elapsedMs = Date.now() - startedAt

assertObject(fixture, 'fixture')
assertObject(fixture.manifest, 'fixture.manifest')
assertObject(fixture.input, 'fixture.input')
assertObject(fixture.input.data, 'fixture.input.data')
assertObject(fixture.legacyOutput, 'fixture.legacyOutput')
assertObject(fixture.legacyOutput.outputs, 'fixture.legacyOutput.outputs')

const data = fixture.input.data
const outputs = fixture.legacyOutput.outputs

const summary = {
  file: path.relative(process.cwd(), resolvedPath),
  fileSizeMb: toMb(stat.size),
  parseTimeMs: elapsedMs,
  schemaVersion: fixture.schemaVersion,
  manifest: {
    schemaVersion: fixture.manifest.schemaVersion,
    name: fixture.manifest.name,
    createdAt: fixture.manifest.createdAt,
    appVersion: fixture.manifest.appVersion,
    inputKind: fixture.manifest.inputKind,
    outputKeys: Object.keys(outputs),
  },
  inputCounts: {
    accounts: countKeys(data.account),
    budgets: countKeys(data.budget),
    merchants: countKeys(data.merchant),
    reminders: countKeys(data.reminder),
    reminderMarkers: countKeys(data.reminderMarker),
    tags: countKeys(data.tag),
    transactions: countKeys(data.transaction),
    users: countKeys(data.user),
    instruments: countKeys(data.instrument),
  },
  outputCounts: {
    months: Array.isArray(outputs.monthList) ? outputs.monthList.length : null,
    envelopes: countKeys(outputs.envelopes),
    envelopeGroups: Array.isArray(outputs.envelopeStructure)
      ? outputs.envelopeStructure.length
      : null,
    keepingEnvelopeIds: Array.isArray(outputs.keepingEnvelopeIds)
      ? outputs.keepingEnvelopeIds.length
      : null,
    budgetMonths: countKeys(outputs.budgets),
    rawActivityMonths: countKeys(outputs.rawActivity),
    activityMonths: countKeys(outputs.activity),
    sortedActivityMonths: countKeys(outputs.sortedActivity),
    envMetricsMonths: countKeys(outputs.envMetrics),
    monthTotalsMonths: countKeys(outputs.monthTotals),
  },
}

console.log(JSON.stringify(summary, null, 2))

function assertObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Expected ${name} to be an object`)
  }
}

function countKeys(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return Object.keys(value).length
}

function toMb(bytes) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10
}

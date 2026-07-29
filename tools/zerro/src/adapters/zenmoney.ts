import type { TZmDiff } from '6-shared/types'

import type { TEndpoint } from '../application/context'
import { ToolError } from '../application/output'

const endpointUrls: Record<TEndpoint, string> = {
  ru: 'https://api.zenmoney.ru/v8/diff/',
  app: 'https://api.zenmoney.app/v8/diff/',
}

export type TZenMoneyDependencies = {
  fetch: typeof fetch
  now: () => number
}

export async function exchangeDiff(
  input: {
    endpoint: TEndpoint
    token: string
    diff: TZmDiff
  },
  dependencies: TZenMoneyDependencies
): Promise<TZmDiff> {
  let response: Response
  try {
    response = await dependencies.fetch(endpointUrls[input.endpoint], {
      method: 'POST',
      body: JSON.stringify({
        ...input.diff,
        currentClientTimestamp: currentClientTimestamp(
          input.diff,
          dependencies.now()
        ),
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.token}`,
      },
    })
  } catch {
    throw new ToolError(
      'refresh',
      'local',
      'NETWORK_FAILURE',
      'ZenMoney refresh request failed',
      6,
      undefined,
      'not_applied',
      true
    )
  }

  let value: unknown
  try {
    value = JSON.parse(await response.text())
  } catch {
    throw invalidResponse(response.status)
  }
  if (!response.ok)
    throw new ToolError(
      'refresh',
      'local',
      'ZENMONEY_REJECTED',
      'ZenMoney rejected the refresh request',
      6,
      { httpStatus: response.status },
      'not_applied',
      response.status >= 500
    )
  return parseWireDiff(value, response.status)
}

function parseWireDiff(value: unknown, httpStatus: number): TZmDiff {
  if (!isRecord(value) || !isFiniteNumber(value.serverTimestamp))
    throw invalidResponse(httpStatus)
  const allowedKeys = new Set([
    'serverTimestamp',
    'deletion',
    'instrument',
    'country',
    'company',
    'user',
    'merchant',
    'account',
    'tag',
    'budget',
    'reminder',
    'reminderMarker',
    'transaction',
  ])
  for (const [key, entities] of Object.entries(value)) {
    if (!allowedKeys.has(key)) throw invalidResponse(httpStatus)
    if (
      key !== 'serverTimestamp' &&
      (!Array.isArray(entities) ||
        entities.some(entity => !isWireEntity(key, entity)))
    )
      throw invalidResponse(httpStatus)
  }
  return value as TZmDiff
}

function isWireEntity(key: string, entity: unknown): boolean {
  if (!isRecord(entity)) return false
  if (key !== 'budget')
    return typeof entity.id === 'string' || typeof entity.id === 'number'
  return (
    isFiniteNumber(entity.changed) &&
    isFiniteNumber(entity.user) &&
    (typeof entity.tag === 'string' || entity.tag === null) &&
    typeof entity.date === 'string' &&
    isFiniteNumber(entity.income) &&
    typeof entity.incomeLock === 'boolean' &&
    typeof entity.isIncomeForecast === 'boolean' &&
    isFiniteNumber(entity.outcome) &&
    typeof entity.outcomeLock === 'boolean' &&
    typeof entity.isOutcomeForecast === 'boolean'
  )
}

function currentClientTimestamp(diff: TZmDiff, now: number): number {
  let timestamp = Math.floor(now / 1000)
  Object.values(diff).forEach(value => {
    if (!Array.isArray(value)) return
    value.forEach(entity => {
      const record: unknown = entity
      if (!isRecord(record)) return
      if (isFiniteNumber(record.changed))
        timestamp = Math.max(timestamp, record.changed)
      if (isFiniteNumber(record.stamp))
        timestamp = Math.max(timestamp, record.stamp)
    })
  })
  return timestamp
}

function invalidResponse(httpStatus: number): ToolError {
  return new ToolError(
    'refresh',
    'local',
    'INVALID_ZENMONEY_RESPONSE',
    'ZenMoney returned an invalid bounded diff response',
    6,
    { httpStatus },
    'not_applied',
    true
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

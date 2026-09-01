import type { TZmDiff } from '6-shared/types'

import type { TEndpoint } from '../application/context'
import { readRetryAfterMs } from '6-shared/api/zenmoney/retryAfter'
import { ToolError } from '../application/output'

const endpointUrls: Record<TEndpoint, string> = {
  ru: 'https://api.zenmoney.ru/v8/diff/',
  app: 'https://api.zenmoney.app/v8/diff/',
}

export type TZenMoneyDependencies = {
  fetch: typeof fetch
  now: () => number
  sleep?: (milliseconds: number) => Promise<void>
}

export type TExchangeMode = 'refresh' | 'sync'

export async function exchangeDiff(
  input: {
    endpoint: TEndpoint
    token: string
    diff: TZmDiff
  },
  dependencies: TZenMoneyDependencies,
  mode: TExchangeMode = 'refresh'
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
    throw exchangeFailure(mode, 'NETWORK_FAILURE', responseMessage(mode), 6)
  }

  const body = await response.text()
  if (!response.ok) {
    const retryAfterMs = readRetryAfterMs(response)
    throw exchangeFailure(
      mode,
      'ZENMONEY_REJECTED',
      'ZenMoney rejected the request',
      6,
      {
        httpStatus: response.status,
        ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
      },
      response.status >= 500
    )
  }

  let value: unknown
  try {
    value = JSON.parse(body)
  } catch {
    throw invalidResponse(response.status, mode)
  }
  return parseWireDiff(value, response.status, mode)
}

function parseWireDiff(
  value: unknown,
  httpStatus: number,
  mode: TExchangeMode
): TZmDiff {
  if (!isRecord(value) || !isFiniteNumber(value.serverTimestamp))
    throw invalidResponse(httpStatus, mode)
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
    if (!allowedKeys.has(key)) throw invalidResponse(httpStatus, mode)
    if (
      key !== 'serverTimestamp' &&
      (!Array.isArray(entities) ||
        entities.some(entity => !isWireEntity(key, entity)))
    )
      throw invalidResponse(httpStatus, mode)
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

function invalidResponse(httpStatus: number, mode: TExchangeMode): ToolError {
  return exchangeFailure(
    mode,
    'INVALID_ZENMONEY_RESPONSE',
    'ZenMoney returned an invalid bounded diff response',
    6,
    { httpStatus }
  )
}

function exchangeFailure(
  mode: TExchangeMode,
  code: string,
  message: string,
  exitCode: number,
  details?: Record<string, number>,
  isUncertain = true
): ToolError {
  if (mode === 'sync')
    return new ToolError(
      'sync',
      'remote',
      code,
      message,
      exitCode,
      details,
      isUncertain ? 'unknown' : 'not_applied',
      false
    )
  return new ToolError(
    'refresh',
    'local',
    code,
    message,
    exitCode,
    details,
    'not_applied',
    isUncertain
  )
}

function responseMessage(mode: TExchangeMode): string {
  return `ZenMoney ${mode} request failed`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

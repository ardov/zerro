import { createHash } from 'node:crypto'

import { ToolError } from './output'

type TCursor = {
  version: 1
  command: string
  revision: string
  queryHash: string
  offset: number
}

export function parseLimit(value: string | undefined, command: string): number {
  if (value === undefined) return 50
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200)
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      '--limit must be an integer from 1 to 200',
      2
    )
  return parsed
}

export function page<T>(
  rows: readonly T[],
  input: {
    command: string
    revision: string
    query: unknown
    limit: number
    cursor?: string
  }
): { items: T[]; returned: number; nextCursor: string | null } {
  const queryHash = createHash('sha256')
    .update(canonicalJson(input.query))
    .digest('hex')
  const offset = input.cursor
    ? parseCursor(input.cursor, input.command, input.revision, queryHash)
    : 0
  const items = rows.slice(offset, offset + input.limit)
  const nextOffset = offset + items.length
  const nextCursor =
    nextOffset < rows.length
      ? Buffer.from(
          JSON.stringify({
            version: 1,
            command: input.command,
            revision: input.revision,
            queryHash,
            offset: nextOffset,
          } satisfies TCursor)
        ).toString('base64url')
      : null
  return { items, returned: items.length, nextCursor }
}

function parseCursor(
  value: string,
  command: string,
  revision: string,
  queryHash: string
): number {
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
  } catch {
    throw invalidCursor(command)
  }
  if (
    !isRecord(parsed) ||
    parsed.version !== 1 ||
    parsed.command !== command ||
    parsed.revision !== revision ||
    parsed.queryHash !== queryHash ||
    !Number.isInteger(parsed.offset) ||
    (parsed.offset as number) < 0
  )
    throw invalidCursor(command)
  return parsed.offset as number
}

function invalidCursor(command: string): ToolError {
  return new ToolError(
    command,
    'none',
    'INVALID_CURSOR',
    'Cursor does not match this query and state revision',
    2
  )
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map(item => canonicalJson(item)).join(',')}]`
  if (isRecord(value))
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`
  return JSON.stringify(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

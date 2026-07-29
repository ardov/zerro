import { ToolError } from './output'

/**
 * --format tsv is a terminal convenience, not part of the JSON contract:
 * nested objects/arrays are JSON-stringified into their cell rather than
 * fanned out into more columns, since a currency vector's keys differ from
 * row to row and would otherwise produce a ragged table.
 */
export function toTsv(items: readonly unknown[]): string {
  const rows = items.filter(isRecord)
  if (!rows.length) return ''
  const columns = collectColumns(rows)
  const lines = [columns.join('\t')]
  rows.forEach(row => {
    lines.push(columns.map(column => formatCell(row[column])).join('\t'))
  })
  return lines.join('\n')
}

export function parseFormat(
  value: string | undefined,
  command: string
): 'json' | 'tsv' {
  if (value === undefined || value === 'json') return 'json'
  if (value === 'tsv') return 'tsv'
  throw new ToolError(
    command,
    'none',
    'INVALID_INPUT',
    '--format must be "json" or "tsv"',
    2
  )
}

/** Renders a command's `{ ok: true, data: { items: [...] } }` result as TSV. */
export function renderResultAsTsv(command: string, result: unknown): string {
  if (!isRecord(result) || result.ok !== true || !isRecord(result.data))
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      '--format tsv requires a successful response',
      2
    )
  const items = result.data.items
  if (!Array.isArray(items))
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      '--format tsv is only supported for commands whose data has an "items" array',
      2
    )
  return toTsv(items)
}

function collectColumns(rows: readonly Record<string, unknown>[]): string[] {
  const columns = new Set<string>()
  rows.forEach(row => Object.keys(row).forEach(key => columns.add(key)))
  return Array.from(columns)
}

function formatCell(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'object')
    return JSON.stringify(value).replace(/\t/g, ' ')
  return String(value).replace(/[\t\n\r]/g, ' ')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

import type { TWarning } from './output'

// Pagination protocol fields survive --fields even when not requested — a
// caller mid-pagination who asked for "items.name" still needs nextCursor to
// fetch the next page, not just the content fields they were projecting.
const PRESERVED_KEYS = ['returned', 'totalCount', 'nextCursor'] as const

/**
 * Projects a response's `data` down to the dot-paths requested via --fields,
 * e.g. "items.name,items.self.budgetByCurrency". Paths that cross an array
 * are mapped per-element, and multiple paths sharing an array prefix are
 * merged into the same per-item objects rather than producing separate
 * parallel arrays. A path that matches nothing is dropped here rather than
 * erroring — this stays a best-effort projection — but `projectResultFields`
 * surfaces the miss as a warning so a typo doesn't silently read as "no data".
 */
export function applyFieldsProjection(
  data: unknown,
  fieldsCsv: string
): unknown {
  const paths = fieldsCsv
    .split(',')
    .map(path => path.trim())
    .filter(Boolean)
  if (!paths.length) return data
  const root: Record<string, unknown> = {}
  paths.forEach(path => setPath(root, data, path.split('.')))
  if (isRecord(data)) {
    PRESERVED_KEYS.forEach(key => {
      if (key in data) root[key] = data[key]
    })
  }
  return root
}

/** Requested --fields paths that matched no value anywhere in `data`. */
export function findUnmatchedFieldPaths(
  data: unknown,
  fieldsCsv: string
): string[] {
  return fieldsCsv
    .split(',')
    .map(path => path.trim())
    .filter(Boolean)
    .filter(path => !pathExists(data, path.split('.')))
}

/** Applies --fields to a command's `{ ok: true, data }` result envelope, if present. */
export function projectResultFields(
  result: unknown,
  fieldsCsv: string | undefined
): unknown {
  if (!fieldsCsv) return result
  if (!isRecord(result) || result.ok !== true || !('data' in result))
    return result
  const unmatched = findUnmatchedFieldPaths(result.data, fieldsCsv)
  const projected = {
    ...result,
    data: applyFieldsProjection(result.data, fieldsCsv),
  }
  if (!unmatched.length) return projected
  const existingWarnings = Array.isArray(result.warnings) ? result.warnings : []
  const warning: TWarning = {
    code: 'UNKNOWN_FIELD_PATH',
    message: `--fields matched nothing for: ${unmatched.join(', ')}`,
    entityIds: unmatched,
  }
  return { ...projected, warnings: [...existingWarnings, warning] }
}

function pathExists(source: unknown, segments: readonly string[]): boolean {
  const [key, ...rest] = segments
  if (!isRecord(source)) return false
  const value = source[key]
  if (value === undefined) return false
  if (rest.length === 0) return true
  if (Array.isArray(value))
    return value.length === 0 || value.some(item => pathExists(item, rest))
  return pathExists(value, rest)
}

function setPath(
  target: Record<string, unknown>,
  source: unknown,
  segments: readonly string[]
): void {
  const [key, ...rest] = segments
  if (!isRecord(source)) return
  const value = source[key]
  if (value === undefined) return

  if (Array.isArray(value)) {
    if (rest.length === 0) {
      target[key] = value
      return
    }
    const existing = Array.isArray(target[key])
      ? (target[key] as unknown[])
      : value.map(() => ({}))
    target[key] = existing
    value.forEach((item, index) => {
      const bucket = existing[index]
      if (isRecord(bucket)) setPath(bucket, item, rest)
    })
    return
  }

  if (rest.length === 0) {
    target[key] = value
    return
  }
  if (!isRecord(value)) {
    target[key] = value
    return
  }
  const existing = isRecord(target[key]) ? target[key] : {}
  target[key] = existing
  setPath(existing, value, rest)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

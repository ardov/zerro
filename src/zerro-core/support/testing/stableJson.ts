import crypto from 'node:crypto'

export function hashJson(value: unknown): string {
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

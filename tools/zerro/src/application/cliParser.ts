import { parseArgs } from 'node:util'

import { ToolError } from './output'
import type { TReadOptions } from './reads'

export const commandOptions = {
  query: { type: 'string' },
  from: { type: 'string' },
  to: { type: 'string' },
  account: { type: 'string' },
  tag: { type: 'string' },
  merchant: { type: 'string' },
  month: { type: 'string' },
  limit: { type: 'string' },
  cursor: { type: 'string' },
  input: { type: 'string' },
  'request-id': { type: 'string' },
  'roots-only': { type: 'boolean' },
  'display-currency': { type: 'string' },
  'group-by': { type: 'string' },
  direction: { type: 'string' },
  type: { type: 'string' },
  'include-archived': { type: 'boolean' },
  shape: { type: 'string' },
  fields: { type: 'string' },
  format: { type: 'string' },
} as const

export type TCliOptions = TReadOptions & {
  input?: string
  'request-id'?: string
}

const allowedOptionsByCommand: Record<string, readonly string[]> = {
  help: ['shape'],
  version: [],
  status: [],
  refresh: [],
  sync: [],
  'accounts list': [
    'include-archived',
    'display-currency',
    'limit',
    'cursor',
    'fields',
    'format',
  ],
  'tags search': ['query', 'limit', 'cursor', 'fields', 'format'],
  'merchants search': ['query', 'limit', 'cursor', 'fields', 'format'],
  'transactions search': [
    'query',
    'from',
    'to',
    'account',
    'tag',
    'merchant',
    'type',
    'display-currency',
    'limit',
    'cursor',
    'fields',
    'format',
  ],
  'month get': ['display-currency', 'fields'],
  'months list': [
    'from',
    'to',
    'limit',
    'cursor',
    'display-currency',
    'fields',
    'format',
  ],
  'envelopes list': [
    'month',
    'query',
    'limit',
    'cursor',
    'roots-only',
    'display-currency',
    'fields',
    'format',
  ],
  'envelopes get': ['month', 'display-currency', 'fields'],
  'goals list': [
    'month',
    'query',
    'limit',
    'cursor',
    'display-currency',
    'fields',
    'format',
  ],
  'debtors list': ['query', 'limit', 'cursor', 'fields', 'format'],
  'budget preview-set': ['input'],
  'budget stage-set': ['input', 'request-id'],
  'outbox list': ['limit', 'cursor', 'fields', 'format'],
  'outbox undo': ['request-id'],
  'transaction preview-create': ['input'],
  'transaction stage-create': ['input', 'request-id'],
  'report activity': [
    'from',
    'to',
    'group-by',
    'direction',
    'display-currency',
    'limit',
    'cursor',
    'fields',
    'format',
  ],
}

const positionalCountByCommand: Record<string, number> = {
  'month get': 1,
  'envelopes get': 1,
}

export type TParsedCommand = {
  command: string
  options: TCliOptions
  positionals: readonly string[]
}

const KNOWN_OPTION_NAMES = Object.keys(commandOptions)

export function parseCommand(argv: readonly string[]): TParsedCommand {
  const args = argv[0] === '--' ? argv.slice(1) : argv
  if (args.includes('--help') || args.includes('-h'))
    return { command: 'help', options: {}, positionals: [] }
  if (args.includes('--version') || args.includes('-v'))
    return { command: 'version', options: {}, positionals: [] }
  const unknownFlag = findUnknownFlagToken(args)
  if (unknownFlag) {
    const suggestion = closestMatch(unknownFlag, KNOWN_OPTION_NAMES)
    throw new ToolError(
      'startup',
      'none',
      'INVALID_INPUT',
      suggestion
        ? `Unknown option --${unknownFlag}. Did you mean --${suggestion}?`
        : `Unknown option --${unknownFlag}; run "pnpm zerro help"`,
      2
    )
  }
  let parsed: ReturnType<typeof parseArgs>
  try {
    parsed = parseArgs({
      args: [...args],
      options: commandOptions,
      strict: true,
      allowPositionals: true,
    })
  } catch {
    throw new ToolError(
      'startup',
      'none',
      'INVALID_INPUT',
      'Invalid CLI options; run "pnpm zerro help"',
      2
    )
  }
  const [domain = 'help', action, ...positionals] = parsed.positionals
  const command = action ? `${domain} ${action}` : domain
  const options = parsed.values as TCliOptions
  // Check the command name itself before its options, so an unrecognized
  // command reports INVALID_COMMAND (with a "did you mean" hint) instead of
  // being masked by whichever option happens to fail the (empty) allow-list
  // for that unknown command.
  if (!(command in allowedOptionsByCommand)) throw invalidCommand(command)
  assertPositionals(command, positionals)
  assertAllowedOptions(command, options)
  return { command, options, positionals }
}

function findUnknownFlagToken(args: readonly string[]): string | undefined {
  for (const token of args) {
    if (!token.startsWith('--')) continue
    const name = token.slice(2).split('=')[0]
    if (name && !KNOWN_OPTION_NAMES.includes(name)) return name
  }
  return undefined
}

export function assertAllowedOptions(
  command: string,
  options: TReadOptions
): void {
  const keys = Object.keys(options).filter(key => options[key] !== undefined)
  const allowed = allowedOptionsByCommand[command] ?? []
  const invalid = keys.find(key => !allowed.includes(key))
  if (invalid) {
    const suggestion = closestMatch(invalid, allowed)
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      suggestion
        ? `Option --${invalid} is not valid for this command. Did you mean --${suggestion}?`
        : `Option --${invalid} is not valid for this command`,
      2
    )
  }
}

export function assertPositionals(
  command: string,
  values: readonly string[]
): void {
  const count = positionalCountByCommand[command] ?? 0
  if (values.length !== count)
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      count
        ? `Command requires ${count} positional argument`
        : 'Command does not accept positional arguments',
      2
    )
}

export function invalidCommand(command: string): ToolError {
  const suggestion = closestMatch(command, Object.keys(allowedOptionsByCommand))
  return new ToolError(
    command || 'help',
    'none',
    'INVALID_COMMAND',
    suggestion
      ? `Unknown command "${command}". Did you mean "${suggestion}"? Run "pnpm zerro help" for the full list.`
      : 'Unknown command; run "pnpm zerro help"',
    2
  )
}

/** Iterative Levenshtein edit distance, used only for "did you mean" hints. */
function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let previousDiagonal = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const previous = row[j]
      row[j] =
        a[i - 1] === b[j - 1]
          ? previousDiagonal
          : 1 + Math.min(previousDiagonal, row[j], row[j - 1])
      previousDiagonal = previous
    }
  }
  return row[b.length]
}

/** Closest candidate to `value`, or undefined when nothing is plausibly a typo of it. */
function closestMatch(
  value: string,
  candidates: readonly string[]
): string | undefined {
  let best: string | undefined
  let bestDistance = Infinity
  for (const candidate of candidates) {
    const distance = editDistance(value, candidate)
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }
  const threshold = Math.max(2, Math.ceil(value.length / 2))
  return bestDistance <= threshold ? best : undefined
}

export function requireRequestId(
  value: string | undefined,
  command: string
): string {
  if (value) return value
  throw new ToolError(
    command,
    'local',
    'INVALID_REQUEST_ID',
    'Command requires --request-id',
    2
  )
}

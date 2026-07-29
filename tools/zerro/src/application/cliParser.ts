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
  status: [],
  refresh: [],
  sync: [],
  'accounts list': ['limit', 'cursor', 'fields', 'format'],
  'tags search': ['query', 'limit', 'cursor', 'fields', 'format'],
  'merchants search': ['query', 'limit', 'cursor', 'fields', 'format'],
  'transactions search': [
    'query',
    'from',
    'to',
    'account',
    'tag',
    'merchant',
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
  'report spending': [
    'from',
    'to',
    'group-by',
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

export function parseCommand(argv: readonly string[]): TParsedCommand {
  const args = argv[0] === '--' ? argv.slice(1) : argv
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
  assertPositionals(command, positionals)
  assertAllowedOptions(command, options)
  return { command, options, positionals }
}

export function assertAllowedOptions(
  command: string,
  options: TReadOptions
): void {
  const keys = Object.keys(options).filter(key => options[key] !== undefined)
  const invalid = keys.find(
    key => !allowedOptionsByCommand[command]?.includes(key)
  )
  if (invalid)
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      `Option --${invalid} is not valid for this command`,
      2
    )
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
  return new ToolError(
    command || 'help',
    'none',
    'INVALID_COMMAND',
    'Unknown command; run "pnpm zerro help"',
    2
  )
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

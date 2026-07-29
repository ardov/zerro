import { parseArgs } from 'node:util'

import { withLocalZmToken } from './adapters/dotenv'
import { loadWorkspace, workspaceMeta } from './adapters/stateFile'
import {
  parseSetEnvelopeBudgetsRequest,
  previewSetEnvelopeBudgets,
  stageSetEnvelopeBudgets,
} from './application/budgetSet'
import { createToolContext } from './application/context'
import { getHelp } from './application/help'
import { readJsonInput } from './application/input'
import { listOutbox, undoLastOutboxCommand } from './application/outbox'
import { failure, ToolError } from './application/output'
import {
  getEnvelope,
  getMonth,
  listDebtors,
  listEnvelopes,
  listGoals,
} from './application/projections'
import {
  listAccounts,
  searchMerchants,
  searchTags,
  searchTransactions,
  type TReadOptions,
} from './application/reads'
import { refresh } from './application/refresh'
import { getStatus } from './application/status'
import { sync } from './application/sync'
import {
  parseCreateTransactionRequest,
  previewCreateTransaction,
  stageCreateTransaction,
} from './application/transactionCreate'

const commandOptions = {
  query: { type: 'string' },
  from: { type: 'string' },
  to: { type: 'string' },
  account: { type: 'string' },
  month: { type: 'string' },
  limit: { type: 'string' },
  cursor: { type: 'string' },
  input: { type: 'string' },
  'request-id': { type: 'string' },
} as const

type TCliOptions = TReadOptions & {
  input?: string
  'request-id'?: string
}

async function run(): Promise<void> {
  let result: unknown
  let exitCode = 0
  try {
    const context = createToolContext(await withLocalZmToken())
    const parsed = parseCliArgs()
    const [domain = 'help', action, ...positionals] = parsed.positionals
    const command = action ? `${domain} ${action}` : domain
    const options = parsed.values as TCliOptions
    assertPositionals(command, positionals)
    assertAllowedOptions(command, options)
    switch (command) {
      case 'help': {
        const workspace = await loadWorkspace(context, 'help')
        result = getHelp(workspaceMeta(workspace, context.now()))
        break
      }
      case 'status':
        result = await getStatus(context)
        break
      case 'refresh':
        result = await refresh(context)
        break
      case 'sync':
        result = await sync(context)
        break
      case 'accounts list':
        result = await listAccounts(context, options)
        break
      case 'tags search':
        result = await searchTags(context, options)
        break
      case 'merchants search':
        result = await searchMerchants(context, options)
        break
      case 'transactions search':
        result = await searchTransactions(context, options)
        break
      case 'month get':
        result = await getMonth(context, positionals[0])
        break
      case 'envelopes list':
        result = await listEnvelopes(context, options)
        break
      case 'envelopes get':
        result = await getEnvelope(context, positionals[0], options)
        break
      case 'goals list':
        result = await listGoals(context, options)
        break
      case 'debtors list':
        result = await listDebtors(context, options)
        break
      case 'budget preview-set': {
        const input = parseSetEnvelopeBudgetsRequest(
          await readJsonInput(options.input, command),
          command
        )
        result = await previewSetEnvelopeBudgets(context, input)
        break
      }
      case 'budget stage-set': {
        const requestId = requireRequestId(options['request-id'], command)
        const input = parseSetEnvelopeBudgetsRequest(
          await readJsonInput(options.input, command),
          command
        )
        result = await stageSetEnvelopeBudgets(context, requestId, input)
        break
      }
      case 'outbox list':
        result = await listOutbox(context, options)
        break
      case 'outbox undo':
        result = await undoLastOutboxCommand(
          context,
          requireRequestId(options['request-id'], command)
        )
        break
      case 'transaction preview-create': {
        const input = parseCreateTransactionRequest(
          await readJsonInput(options.input, command),
          command
        )
        result = await previewCreateTransaction(context, input)
        break
      }
      case 'transaction stage-create': {
        const requestId = requireRequestId(options['request-id'], command)
        const input = parseCreateTransactionRequest(
          await readJsonInput(options.input, command),
          command
        )
        result = await stageCreateTransaction(context, requestId, input)
        break
      }
      default:
        throw invalidCommand(command)
    }
  } catch (error) {
    const normalized =
      error instanceof ToolError
        ? error
        : new ToolError(
            'startup',
            'none',
            'INTERNAL_ERROR',
            'The local tool failed without applying a change',
            5
          )
    result = failure(normalized)
    exitCode = normalized.exitCode
  }

  process.stdout.write(`${JSON.stringify(result)}\n`)
  process.exitCode = exitCode
}

function invalidCommand(command: string): ToolError {
  return new ToolError(
    command || 'help',
    'none',
    'INVALID_COMMAND',
    'Unknown command; run "pnpm zerro -- help"',
    2
  )
}

function parseCliArgs() {
  try {
    return parseArgs({
      args: process.argv.slice(2),
      options: commandOptions,
      strict: true,
      allowPositionals: true,
    })
  } catch {
    throw new ToolError(
      'startup',
      'none',
      'INVALID_INPUT',
      'Invalid CLI options; run "pnpm zerro -- help"',
      2
    )
  }
}

function assertAllowedOptions(command: string, options: TReadOptions): void {
  const allowed: Record<string, readonly string[]> = {
    help: [],
    status: [],
    refresh: [],
    sync: [],
    'accounts list': ['limit', 'cursor'],
    'tags search': ['query', 'limit', 'cursor'],
    'merchants search': ['query', 'limit', 'cursor'],
    'transactions search': [
      'query',
      'from',
      'to',
      'account',
      'limit',
      'cursor',
    ],
    'month get': [],
    'envelopes list': ['month', 'query', 'limit', 'cursor'],
    'envelopes get': ['month'],
    'goals list': ['month', 'query', 'limit', 'cursor'],
    'debtors list': ['query', 'limit', 'cursor'],
    'budget preview-set': ['input'],
    'budget stage-set': ['input', 'request-id'],
    'outbox list': ['limit', 'cursor'],
    'outbox undo': ['request-id'],
    'transaction preview-create': ['input'],
    'transaction stage-create': ['input', 'request-id'],
  }
  const keys = Object.keys(options).filter(key => options[key] !== undefined)
  const invalid = keys.find(key => !allowed[command]?.includes(key))
  if (invalid)
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      `Option --${invalid} is not valid for this command`,
      2
    )
}

function requireRequestId(value: string | undefined, command: string): string {
  if (value) return value
  throw new ToolError(
    command,
    'local',
    'INVALID_REQUEST_ID',
    'Command requires --request-id',
    2
  )
}

function assertPositionals(command: string, values: readonly string[]): void {
  const expected: Record<string, number> = {
    'month get': 1,
    'envelopes get': 1,
  }
  const count = expected[command] ?? 0
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

void run()

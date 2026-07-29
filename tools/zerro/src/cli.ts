import { withLocalZmToken } from './adapters/dotenv'
import { loadWorkspace, workspaceMeta } from './adapters/stateFile'
import {
  parseSetEnvelopeBudgetsRequest,
  previewSetEnvelopeBudgets,
  stageSetEnvelopeBudgets,
} from './application/budgetSet'
import {
  invalidCommand,
  parseCommand,
  requireRequestId,
} from './application/cliParser'
import { createToolContext } from './application/context'
import { projectResultFields } from './application/fields'
import { getHelp, getHelpShape } from './application/help'
import { readJsonInput } from './application/input'
import { listOutbox, undoLastOutboxCommand } from './application/outbox'
import { failure, ToolError } from './application/output'
import {
  getEnvelope,
  getMonth,
  listDebtors,
  listEnvelopes,
  listGoals,
  listMonths,
} from './application/projections'
import {
  listAccounts,
  searchMerchants,
  searchTags,
  searchTransactions,
} from './application/reads'
import { refresh } from './application/refresh'
import { getSpendingReport } from './application/reports'
import { getStatus } from './application/status'
import { sync } from './application/sync'
import {
  parseCreateTransactionRequest,
  previewCreateTransaction,
  stageCreateTransaction,
} from './application/transactionCreate'
import { parseFormat, renderResultAsTsv } from './application/tsv'

async function run(): Promise<void> {
  let result: unknown
  let exitCode = 0
  let tsvOutput: string | undefined
  try {
    const context = createToolContext(await withLocalZmToken())
    const { command, options, positionals } = parseCommand(
      process.argv.slice(2)
    )
    const format = parseFormat(options.format, command)
    switch (command) {
      case 'help': {
        const workspace = await loadWorkspace(context, 'help')
        const meta = workspaceMeta(workspace, context.now())
        result = options.shape
          ? getHelpShape(meta, options.shape)
          : getHelp(meta)
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
        result = await getMonth(context, positionals[0], options)
        break
      case 'months list':
        result = await listMonths(context, options)
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
      case 'report spending':
        result = await getSpendingReport(context, options)
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
    result = projectResultFields(result, options.fields)
    if (format === 'tsv') tsvOutput = renderResultAsTsv(command, result)
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
    tsvOutput = undefined
  }

  process.stdout.write(
    tsvOutput !== undefined ? `${tsvOutput}\n` : `${JSON.stringify(result)}\n`
  )
  process.exitCode = exitCode
}

void run()

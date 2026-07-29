import {
  createZerroSession,
  type TTransactionFilterClause,
} from 'zerro-core/headless'

import type { TToolContext } from './context'
import {
  buildFullRates,
  convertFx,
  resolveDisplayCurrency,
  type TFxVector,
} from './fx'
import { ToolError, success } from './output'
import { page, parseLimit } from './pagination'
import { transactionType, type TReadOptions } from './reads'
import {
  loadWorkspace,
  workspaceMeta,
  type TWorkspace,
} from '../adapters/stateFile'

const GROUP_BY_VALUES = ['tag', 'merchant', 'account', 'month'] as const
type TGroupBy = (typeof GROUP_BY_VALUES)[number]

type TReportTransaction = {
  date: string
  income: number
  outcome: number
  incomeAccount: string
  outcomeAccount: string
  outcomeInstrument: number
  tag: string[] | null
  merchant: string | null
}

export async function getSpendingReport(
  context: TToolContext,
  options: TReadOptions
) {
  const command = 'report spending'
  const workspace = await loadWorkspace(context, command)
  requireInitialized(workspace, command)
  const groupBy = parseGroupBy(options['group-by'], command)
  validateDate(options.from, '--from', command)
  validateDate(options.to, '--to', command)
  if (options.from && options.to && options.from > options.to)
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      '--from must not be after --to',
      2
    )
  const displayCurrency = resolveDisplayCurrency(
    options,
    workspace.current.instrument,
    command
  )
  const limit = parseLimit(options.limit, command)
  const rates = buildFullRates(workspace.current.instrument)
  const sortCurrency =
    displayCurrency ?? findBaseCode(workspace.current.instrument)

  const clauses: TTransactionFilterClause[] = []
  if (options.from || options.to)
    clauses.push({
      kind: 'date',
      ...(options.from
        ? {
            from: options.from as Extract<
              TTransactionFilterClause,
              { kind: 'date' }
            >['from'],
          }
        : {}),
      ...(options.to
        ? {
            to: options.to as Extract<
              TTransactionFilterClause,
              { kind: 'date' }
            >['to'],
          }
        : {}),
    })

  const session = createZerroSession(workspace.current, {
    now: context.now,
    uuid: () => 'read-only',
  })
  const routing = session.activity.getRoutingContext()

  const groups = new Map<
    string,
    { name: string; total: TFxVector; transactionCount: number }
  >()
  const grandTotal: TFxVector = {}
  let grandCount = 0

  session.transactions.query({ clauses }).forEach(transaction => {
    if (transactionType(transaction, routing.debtAccountId) !== 'outcome')
      return
    const code =
      workspace.current.instrument[transaction.outcomeInstrument]?.shortTitle
    if (!code) return
    const amount = transaction.outcome
    grandTotal[code] = round((grandTotal[code] ?? 0) + amount)
    grandCount += 1

    const bucket = bucketFor(groupBy, transaction, workspace)
    const existing = groups.get(bucket.key)
    if (existing) {
      existing.total[code] = round((existing.total[code] ?? 0) + amount)
      existing.transactionCount += 1
    } else {
      groups.set(bucket.key, {
        name: bucket.name,
        total: { [code]: amount },
        transactionCount: 1,
      })
    }
  })

  const rows = Array.from(groups.entries())
    .map(([key, group]) => ({
      key,
      name: group.name,
      total: group.total,
      transactionCount: group.transactionCount,
      ...(displayCurrency
        ? { totalConverted: convertFx(group.total, displayCurrency, rates) }
        : {}),
      sortValue: convertFx(group.total, sortCurrency, rates),
    }))
    .sort((left, right) => right.sortValue - left.sortValue)
    .map(({ sortValue: _sortValue, ...row }) => row)

  return success(command, 'none', workspaceMeta(workspace, context.now()), {
    groupBy,
    from: options.from ?? null,
    to: options.to ?? null,
    displayCurrency: displayCurrency ?? null,
    ...page(rows, {
      command,
      revision: workspace.revision,
      query: {
        groupBy,
        from: options.from ?? null,
        to: options.to ?? null,
        displayCurrency: displayCurrency ?? null,
      },
      limit,
      cursor: options.cursor,
    }),
    totals: {
      total: grandTotal,
      transactionCount: grandCount,
      ...(displayCurrency
        ? { totalConverted: convertFx(grandTotal, displayCurrency, rates) }
        : {}),
    },
  })
}

function bucketFor(
  groupBy: TGroupBy,
  transaction: TReportTransaction,
  workspace: TWorkspace
): { key: string; name: string } {
  switch (groupBy) {
    case 'tag': {
      const tagId = transaction.tag?.[0]
      if (!tagId) return { key: 'none', name: 'No tag' }
      return { key: tagId, name: workspace.current.tag[tagId]?.title ?? tagId }
    }
    case 'merchant': {
      const merchantId = transaction.merchant
      if (!merchantId) return { key: 'none', name: 'No merchant' }
      return {
        key: merchantId,
        name: workspace.current.merchant[merchantId]?.title ?? merchantId,
      }
    }
    case 'account': {
      const accountId = transaction.outcomeAccount
      return {
        key: accountId,
        name: workspace.current.account[accountId]?.title ?? accountId,
      }
    }
    case 'month': {
      const month = transaction.date.slice(0, 7)
      return { key: month, name: month }
    }
  }
}

function findBaseCode(
  instruments: Record<number, { shortTitle: string; rate: number }>
): string {
  const base = Object.values(instruments).find(
    instrument => instrument.rate === 1
  )
  return base?.shortTitle ?? 'RUB'
}

function parseGroupBy(value: string | undefined, command: string): TGroupBy {
  if (value && (GROUP_BY_VALUES as readonly string[]).includes(value))
    return value as TGroupBy
  throw new ToolError(
    command,
    'none',
    'INVALID_INPUT',
    '--group-by must be one of: tag, merchant, account, month',
    2
  )
}

function validateDate(
  value: string | undefined,
  option: string,
  command: string
): void {
  if (value !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      `${option} must use YYYY-MM-DD`,
      2
    )
}

function requireInitialized(workspace: TWorkspace, command: string): void {
  if (
    !Object.keys(workspace.current.user).length ||
    !Object.keys(workspace.current.instrument).length
  )
    throw new ToolError(
      command,
      'none',
      'STATE_NOT_INITIALIZED',
      'Run refresh before reading reports',
      4
    )
}

function round(amount: number): number {
  return Math.round(amount * 100) / 100
}

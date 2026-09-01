import {
  createZerroSession,
  routeTransactionToActivity,
  type TTransactionFilterClause,
} from '@/zerro-core/headless'

import type { TToolContext } from './context'
import {
  buildFullRates,
  convertFx,
  resolveDisplayCurrency,
  round,
  type TFxVector,
} from './fx'
import { ToolError, success, type TWarning } from './output'
import { page, parseLimit } from './pagination'
import type { TReadOptions } from './reads'
import {
  loadWorkspace,
  workspaceMeta,
  type TWorkspace,
} from '../adapters/stateFile'

const GROUP_BY_VALUES = ['tag', 'merchant', 'account', 'month'] as const
type TGroupBy = (typeof GROUP_BY_VALUES)[number]

const DIRECTION_VALUES = ['net', 'outcome', 'income'] as const
type TDirection = (typeof DIRECTION_VALUES)[number]

type TRouteDirection = 'income' | 'outcome'

type TReportTransaction = {
  id: string
  date: string
  income: number
  outcome: number
  incomeAccount: string | null
  outcomeAccount: string | null
  incomeInstrument: number
  outcomeInstrument: number
  tag: string[] | null
  merchant: string | null
}

/**
 * Scoped to tag-routed activity: the same in-budget/out-of-budget and
 * envelope-category split `routeTransactionToActivity` uses for the app's
 * own envelope view. Transfers between accounts and debt movements land on
 * account/merchant/payee envelopes, not tag envelopes, and are out of scope
 * here — see `transactions search --type transfer|debt` and `debtors list`
 * for those.
 */
export async function getActivityReport(
  context: TToolContext,
  options: TReadOptions
) {
  const command = 'report activity'
  const workspace = await loadWorkspace(context, command)
  requireInitialized(workspace, command)
  const groupBy = parseGroupBy(options['group-by'], command)
  const direction = parseDirection(options.direction, command)
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
  const envelopes = session.envelopes.getAll()

  const groups = new Map<
    string,
    { name: string; total: TFxVector; transactionCount: number }
  >()
  const grandTotal: TFxVector = {}
  let grandCount = 0
  let multiTagCount = 0
  const multiTagIds: string[] = []

  session.transactions.query({ clauses }).forEach(transaction => {
    const route = routeTransactionToActivity(transaction, routing)
    if (!route || route.direction === 'internal') return
    const envelope = envelopes[route.envelopeId]
    if (!envelope || envelope.type !== 'tag') return
    const routeDirection: TRouteDirection = route.direction

    const signedAmount = signedActivityAmount(
      direction,
      routeDirection,
      envelope.keepIncome,
      transaction
    )
    if (signedAmount === null) return

    const code =
      workspace.current.instrument[
        routeDirection === 'income'
          ? transaction.incomeInstrument
          : transaction.outcomeInstrument
      ]?.shortTitle
    if (!code) return

    if ((transaction.tag?.length ?? 0) > 1) {
      multiTagCount += 1
      if (multiTagIds.length < 20) multiTagIds.push(transaction.id)
    }

    grandTotal[code] = round((grandTotal[code] ?? 0) + signedAmount)
    grandCount += 1

    const bucket = bucketFor(groupBy, transaction, routeDirection, workspace)
    const existing = groups.get(bucket.key)
    if (existing) {
      existing.total[code] = round((existing.total[code] ?? 0) + signedAmount)
      existing.transactionCount += 1
    } else {
      groups.set(bucket.key, {
        name: bucket.name,
        total: { [code]: signedAmount },
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
      sortValue: Math.abs(convertFx(group.total, sortCurrency, rates)),
    }))
    .sort((left, right) => right.sortValue - left.sortValue)
    .map(({ sortValue: _sortValue, ...row }) => row)

  const warnings: TWarning[] = []
  if (multiTagCount > 0)
    warnings.push({
      code: 'MULTI_TAG_TRANSACTIONS',
      message: `${multiTagCount} transaction(s) carry more than one tag; only the first tag is used for grouping and netting, so totals may undercount the others.`,
      entityIds: multiTagIds,
    })

  return success(
    command,
    'none',
    workspaceMeta(workspace, context.now()),
    {
      groupBy,
      direction,
      from: options.from ?? null,
      to: options.to ?? null,
      displayCurrency: displayCurrency ?? null,
      ...page(rows, {
        command,
        revision: workspace.revision,
        query: {
          groupBy,
          direction,
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
    },
    warnings
  )
}

/**
 * Sign convention: positive = money leaving the budget (spend), negative =
 * net money entering it. `net` mirrors the app's own envelope rule — a
 * refund only offsets spend in envelopes configured to keep their income
 * (`keepIncome`); income elsewhere (salary, interest, debt collection) is
 * general income and stays out of a spending report, matching why it
 * doesn't appear in `report spending` today either.
 */
function signedActivityAmount(
  direction: TDirection,
  routeDirection: TRouteDirection,
  keepIncome: boolean,
  transaction: TReportTransaction
): number | null {
  if (direction === 'outcome')
    return routeDirection === 'outcome' ? transaction.outcome : null
  if (direction === 'income')
    return routeDirection === 'income' ? transaction.income : null
  if (routeDirection === 'outcome') return transaction.outcome
  return keepIncome ? -transaction.income : null
}

function bucketFor(
  groupBy: TGroupBy,
  transaction: TReportTransaction,
  routeDirection: TRouteDirection,
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
      const accountId =
        routeDirection === 'income'
          ? transaction.incomeAccount
          : transaction.outcomeAccount
      // Absent on a soft-deleted row whose leg an account deletion cleared,
      // grouped the same way a missing merchant is.
      if (!accountId) return { key: 'none', name: 'No account' }
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

function parseDirection(
  value: string | undefined,
  command: string
): TDirection {
  if (value === undefined) return 'net'
  if ((DIRECTION_VALUES as readonly string[]).includes(value))
    return value as TDirection
  throw new ToolError(
    command,
    'none',
    'INVALID_INPUT',
    '--direction must be one of: net, outcome, income',
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

import { createZerroSession } from 'zerro-core/headless'

import type { TToolContext } from './context'
import { buildFullRates, convertAmounts, resolveDisplayCurrency } from './fx'
import { ToolError, success } from './output'
import { page, parseLimit } from './pagination'
import type { TReadOptions } from './reads'
import {
  loadWorkspace,
  workspaceMeta,
  type TWorkspace,
} from '../adapters/stateFile'

type TSession = ReturnType<typeof createZerroSession>
type TMonth = keyof ReturnType<TSession['months']['getTotals']> & string
type TEnvelopeMap = ReturnType<TSession['envelopes']['getAll']>
type TEnvelope = TEnvelopeMap[keyof TEnvelopeMap]
type TMetricsByMonth = ReturnType<TSession['envelopes']['getMetrics']>
type TMetricsMap = TMetricsByMonth[keyof TMetricsByMonth]
type TMetrics = TMetricsMap[keyof TMetricsMap]

export async function getMonth(
  context: TToolContext,
  monthInput: string | undefined,
  options: TReadOptions = {}
) {
  const command = 'month get'
  const month = parseMonth(monthInput, command)
  const workspace = await loadWorkspace(context, command)
  requireInitialized(workspace, command)
  const displayCurrency = resolveDisplayCurrency(
    options,
    workspace.current.instrument,
    command
  )
  const session = makeSession(context, workspace)
  requireProjectedMonth(session.months.getList(), month, command)
  return projectionSuccess(
    context,
    workspace,
    command,
    buildMonthSummary(session, workspace, month, displayCurrency)
  )
}

export async function listMonths(context: TToolContext, options: TReadOptions) {
  const command = 'months list'
  const workspace = await loadWorkspace(context, command)
  requireInitialized(workspace, command)
  const displayCurrency = resolveDisplayCurrency(
    options,
    workspace.current.instrument,
    command
  )
  const from = options.from ? parseMonth(options.from, command) : undefined
  const to = options.to ? parseMonth(options.to, command) : undefined
  if (from && to && from > to)
    throw invalidInput(command, '--from must not be after --to')
  const limit = parseLimit(options.limit, command)
  const session = makeSession(context, workspace)
  const rows = session.months
    .getList()
    .filter(month => (!from || month >= from) && (!to || month <= to))
    .map(month => buildMonthSummary(session, workspace, month, displayCurrency))

  return projectionSuccess(context, workspace, command, {
    displayCurrency: displayCurrency ?? null,
    ...page(rows, {
      command,
      revision: workspace.revision,
      query: { from: from ?? null, to: to ?? null, displayCurrency },
      limit,
      cursor: options.cursor,
    }),
  })
}

function buildMonthSummary(
  session: TSession,
  workspace: TWorkspace,
  month: TMonth,
  displayCurrency: string | undefined
) {
  const metrics = session.envelopes.getMetrics()[month]
  const envelopes = session.envelopes.getAll()
  const monthTotals = session.months.getTotals()[month]
  const goalTotals = session.goals.getTotals()[month] ?? {
    need: {},
    target: {},
    progress: 0,
    goalsCount: 0,
  }
  const metricRows = Object.values(metrics)
  const rates = buildFullRates(workspace.current.instrument)

  // `positiveBudgeted` is the sum of allocations to spending envelopes;
  // `budgeted` (core's field) also nets in negative allocations on income
  // envelopes, which makes it look near-zero even in a fully-budgeted month.
  // Expose the useful one as `budgeted` and keep the net under its own name.
  const undistributedIncome = sumFxVectors(
    Object.values(envelopes)
      .filter(
        envelope =>
          envelope.parent === null && isIncomeEnvelope(envelope, workspace)
      )
      .map(envelope => metrics[envelope.id]?.totalAvailable ?? {})
  )
  const totals = {
    ...monthTotals,
    budgeted: monthTotals.positiveBudgeted,
    budgetedNet: monthTotals.budgeted,
    undistributedIncome,
  }

  return {
    month,
    displayCurrency: displayCurrency ?? null,
    totals,
    ...(displayCurrency
      ? {
          totalsConverted: convertAmounts(
            {
              fundsStart: monthTotals.fundsStart,
              fundsChange: monthTotals.fundsChange,
              fundsEnd: monthTotals.fundsEnd,
              transferFees: monthTotals.transferFees,
              generalIncome: monthTotals.generalIncome,
              envActivity: monthTotals.envActivity,
              budgeted: monthTotals.positiveBudgeted,
              budgetedNet: monthTotals.budgeted,
              available: monthTotals.available,
              budgetedInFuture: monthTotals.budgetedInFuture,
              freeFunds: monthTotals.freeFunds,
              toBeBudgeted: monthTotals.toBeBudgeted,
              overspend: monthTotals.overspend,
              undistributedIncome,
            },
            displayCurrency,
            rates
          ),
        }
      : {}),
    envelopes: {
      envelopeCount: Object.keys(envelopes).length,
      rootEnvelopeCount: Object.values(envelopes).filter(
        envelope => envelope.parent === null
      ).length,
      budgetedEnvelopeCount: metricRows.filter(
        row => (row.selfBudgeted[row.currency] ?? 0) !== 0
      ).length,
      transactionCount: metricRows.reduce(
        (sum, row) => sum + row.selfTransactionCount,
        0
      ),
      budgeted: monthTotals.positiveBudgeted,
      activity: monthTotals.envActivity,
      available: monthTotals.available,
    },
    goals: goalTotals,
    ...(displayCurrency
      ? {
          goalsConverted: convertAmounts(
            { need: goalTotals.need, target: goalTotals.target },
            displayCurrency,
            rates
          ),
        }
      : {}),
  }
}

export async function listEnvelopes(
  context: TToolContext,
  options: TReadOptions
) {
  const command = 'envelopes list'
  const month = parseMonth(options.month, command)
  const workspace = await loadWorkspace(context, command)
  requireInitialized(workspace, command)
  const displayCurrency = resolveDisplayCurrency(
    options,
    workspace.current.instrument,
    command
  )
  const session = makeSession(context, workspace)
  requireProjectedMonth(session.months.getList(), month, command)
  const query = normalizeQuery(options.query)
  const limit = parseLimit(options.limit, command)
  const rootsOnly =
    (options as { 'roots-only'?: boolean })['roots-only'] === true
  const envelopes = session.envelopes.getAll()
  const metrics = session.envelopes.getMetrics()[month]
  const rates = buildFullRates(workspace.current.instrument)
  const rows = Object.values(envelopes)
    .filter(envelope => envelope.name.toLocaleLowerCase().includes(query))
    .filter(envelope => !rootsOnly || envelope.parent === null)
    .sort(
      (left, right) =>
        left.index - right.index || left.id.localeCompare(right.id)
    )
    .map(envelope =>
      presentEnvelope(envelope, metrics[envelope.id], displayCurrency, rates)
    )

  return projectionSuccess(context, workspace, command, {
    displayCurrency: displayCurrency ?? null,
    ...page(rows, {
      command,
      revision: workspace.revision,
      query: { month, query, rootsOnly, displayCurrency },
      limit,
      cursor: options.cursor,
    }),
  })
}

export async function getEnvelope(
  context: TToolContext,
  envelopeId: string | undefined,
  options: TReadOptions
) {
  const command = 'envelopes get'
  const month = parseMonth(options.month, command)
  if (!envelopeId) throw invalidInput(command, 'Envelope id is required')
  const workspace = await loadWorkspace(context, command)
  requireInitialized(workspace, command)
  const displayCurrency = resolveDisplayCurrency(
    options,
    workspace.current.instrument,
    command
  )
  const session = makeSession(context, workspace)
  requireProjectedMonth(session.months.getList(), month, command)
  const envelope = session.envelopes.getAll()[envelopeId as keyof TEnvelopeMap]
  if (!envelope)
    throw new ToolError(
      command,
      'none',
      'ENTITY_NOT_FOUND',
      'Envelope was not found',
      3,
      { envelopeId }
    )
  const rates = buildFullRates(workspace.current.instrument)
  return projectionSuccess(
    context,
    workspace,
    command,
    presentEnvelope(
      envelope,
      session.envelopes.getMetrics()[month][envelope.id],
      displayCurrency,
      rates
    )
  )
}

export async function listGoals(context: TToolContext, options: TReadOptions) {
  const command = 'goals list'
  const month = parseMonth(options.month, command)
  const workspace = await loadWorkspace(context, command)
  requireInitialized(workspace, command)
  const displayCurrency = resolveDisplayCurrency(
    options,
    workspace.current.instrument,
    command
  )
  const session = makeSession(context, workspace)
  requireProjectedMonth(session.months.getList(), month, command)
  const limit = parseLimit(options.limit, command)
  const query = normalizeQuery(options.query)
  const envelopes = session.envelopes.getAll()
  const rows = Object.values(session.goals.getAll()[month] ?? {})
    .filter(goal => {
      const name = envelopes[goal.id]?.name ?? ''
      return name.toLocaleLowerCase().includes(query)
    })
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(goal => ({
      envelopeId: goal.id,
      envelopeName: envelopes[goal.id]?.name ?? '',
      month: goal.month,
      currency: goal.currency,
      goal: goal.goal,
      progress: goal.progress,
      needNow: goal.needNow,
      needStart: goal.needStart,
      targetBudget: goal.targetBudget,
    }))
  const paged = page(rows, {
    command,
    revision: workspace.revision,
    query: { month, query, displayCurrency },
    limit,
    cursor: options.cursor,
  })
  const totals = session.goals.getTotals()[month] ?? {
    need: {},
    target: {},
    progress: 0,
    goalsCount: 0,
  }
  return projectionSuccess(context, workspace, command, {
    displayCurrency: displayCurrency ?? null,
    ...paged,
    totals,
    ...(displayCurrency
      ? {
          totalsConverted: convertAmounts(
            { need: totals.need, target: totals.target },
            displayCurrency,
            buildFullRates(workspace.current.instrument)
          ),
        }
      : {}),
  })
}

export async function listDebtors(
  context: TToolContext,
  options: TReadOptions
) {
  const command = 'debtors list'
  const workspace = await loadWorkspace(context, command)
  requireInitialized(workspace, command)
  const limit = parseLimit(options.limit, command)
  const query = normalizeQuery(options.query)
  const rows = Object.values(makeSession(context, workspace).debtors.getAll())
    .filter(debtor => debtor.name.toLocaleLowerCase().includes(query))
    .sort(compareNameAndId)
    .map(debtor => ({
      id: debtor.id,
      name: debtor.name,
      merchant:
        debtor.merchantId && debtor.merchantName
          ? { id: debtor.merchantId, title: debtor.merchantName }
          : null,
      payeeNames: debtor.payeeNames.slice(0, 20),
      payeeNameCount: debtor.payeeNames.length,
      transactionCount: debtor.transactions.length,
      balance: debtor.balance,
    }))
  return projectionSuccess(
    context,
    workspace,
    command,
    page(rows, {
      command,
      revision: workspace.revision,
      query: { query },
      limit,
      cursor: options.cursor,
    })
  )
}

function presentEnvelope(
  envelope: TEnvelope,
  metrics: TMetrics,
  displayCurrency?: string,
  rates?: Record<string, number>
) {
  const converted =
    displayCurrency && rates
      ? {
          self: convertAmounts(
            {
              budget: metrics.selfBudgeted,
              activity: metrics.selfActivity,
              available: metrics.selfAvailable,
            },
            displayCurrency,
            rates
          ),
          withChildren: convertAmounts(
            {
              budget: metrics.totalBudgeted,
              activity: metrics.totalActivity,
              available: metrics.totalAvailable,
            },
            displayCurrency,
            rates
          ),
        }
      : undefined

  return {
    id: envelope.id,
    name: envelope.name,
    type: envelope.type,
    group: envelope.group,
    isRoot: envelope.parent === null,
    parentId: envelope.parent,
    childIds: envelope.children.slice(0, 200),
    childCount: envelope.children.length,
    currency: envelope.currency,
    visibility: envelope.visibility,
    keepIncome: envelope.keepIncome,
    self: {
      budgetByCurrency: metrics.selfBudgeted,
      activityByCurrency: metrics.selfActivity,
      availableByCurrency: metrics.selfAvailable,
      transactionCount: metrics.selfTransactionCount,
      ...(converted ? { converted: converted.self } : {}),
    },
    withChildren: {
      budgetByCurrency: metrics.totalBudgeted,
      activityByCurrency: metrics.totalActivity,
      availableByCurrency: metrics.totalAvailable,
      transactionCount: metrics.totalTransactionCount,
      ...(converted ? { converted: converted.withChildren } : {}),
    },
  }
}

function makeSession(context: TToolContext, workspace: TWorkspace) {
  return createZerroSession(workspace.current, {
    now: context.now,
    uuid: () => 'read-only',
  })
}

function projectionSuccess<T>(
  context: TToolContext,
  workspace: TWorkspace,
  command: string,
  data: T
) {
  return success(command, 'none', workspaceMeta(workspace, context.now()), data)
}

function parseMonth(value: string | undefined, command: string): TMonth {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value))
    throw invalidInput(command, 'Month must use YYYY-MM')
  return value as TMonth
}

function requireProjectedMonth(
  months: readonly TMonth[],
  month: TMonth,
  command: string
): void {
  if (!months.includes(month))
    throw new ToolError(
      command,
      'none',
      'MONTH_NOT_FOUND',
      'Month is outside the available projection range',
      3,
      { month }
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
      'Run refresh before reading financial projections',
      4
    )
}

function invalidInput(command: string, message: string): ToolError {
  return new ToolError(command, 'none', 'INVALID_INPUT', message, 2)
}

function normalizeQuery(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? ''
}

// A tag-backed envelope with showIncome but not showOutcome is where income
// lands before the user allocates it into spending envelopes.
function isIncomeEnvelope(envelope: TEnvelope, workspace: TWorkspace): boolean {
  if (!envelope.id.startsWith('tag#')) return false
  const tag = workspace.current.tag[envelope.id.slice('tag#'.length)]
  return tag?.showIncome === true && tag?.showOutcome === false
}

function sumFxVectors(
  vectors: readonly Record<string, number>[]
): Record<string, number> {
  const result: Record<string, number> = {}
  vectors.forEach(vector => {
    Object.entries(vector).forEach(([code, value]) => {
      result[code] = Math.round(((result[code] ?? 0) + value) * 100) / 100
    })
  })
  return result
}

function compareNameAndId(
  left: { name: string; id: string },
  right: { name: string; id: string }
): number {
  return left.name.localeCompare(right.name) || left.id.localeCompare(right.id)
}

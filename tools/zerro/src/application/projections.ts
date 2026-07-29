import { createZerroSession } from 'zerro-core/headless'

import type { TToolContext } from './context'
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
  monthInput: string | undefined
) {
  const command = 'month get'
  const month = parseMonth(monthInput, command)
  const workspace = await loadWorkspace(context, command)
  requireInitialized(workspace, command)
  const session = makeSession(context, workspace)
  requireProjectedMonth(session.months.getList(), month, command)
  const metrics = session.envelopes.getMetrics()[month]
  const envelopes = session.envelopes.getAll()
  const monthTotals = session.months.getTotals()[month]
  const goalTotals = session.goals.getTotals()[month]
  const metricRows = Object.values(metrics)

  return projectionSuccess(context, workspace, command, {
    month,
    totals: monthTotals,
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
      budgeted: monthTotals.budgeted,
      activity: monthTotals.envActivity,
      available: monthTotals.available,
    },
    goals:
      goalTotals ??
      ({
        need: {},
        target: {},
        progress: 0,
        goalsCount: 0,
      } as const),
  })
}

export async function listEnvelopes(
  context: TToolContext,
  options: TReadOptions
) {
  const command = 'envelopes list'
  const month = parseMonth(options.month, command)
  const workspace = await loadWorkspace(context, command)
  requireInitialized(workspace, command)
  const session = makeSession(context, workspace)
  requireProjectedMonth(session.months.getList(), month, command)
  const query = normalizeQuery(options.query)
  const limit = parseLimit(options.limit, command)
  const envelopes = session.envelopes.getAll()
  const metrics = session.envelopes.getMetrics()[month]
  const rows = Object.values(envelopes)
    .filter(envelope => envelope.name.toLocaleLowerCase().includes(query))
    .sort(
      (left, right) =>
        left.index - right.index || left.id.localeCompare(right.id)
    )
    .map(envelope => presentEnvelope(envelope, metrics[envelope.id]))

  return projectionSuccess(
    context,
    workspace,
    command,
    page(rows, {
      command,
      revision: workspace.revision,
      query: { month, query },
      limit,
      cursor: options.cursor,
    })
  )
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
  return projectionSuccess(
    context,
    workspace,
    command,
    presentEnvelope(
      envelope,
      session.envelopes.getMetrics()[month][envelope.id]
    )
  )
}

export async function listGoals(context: TToolContext, options: TReadOptions) {
  const command = 'goals list'
  const month = parseMonth(options.month, command)
  const workspace = await loadWorkspace(context, command)
  requireInitialized(workspace, command)
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
    query: { month, query },
    limit,
    cursor: options.cursor,
  })
  return projectionSuccess(context, workspace, command, {
    ...paged,
    totals: session.goals.getTotals()[month] ?? {
      need: {},
      target: {},
      progress: 0,
      goalsCount: 0,
    },
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

function presentEnvelope(envelope: TEnvelope, metrics: TMetrics) {
  return {
    id: envelope.id,
    name: envelope.name,
    type: envelope.type,
    group: envelope.group,
    parentId: envelope.parent,
    childIds: envelope.children.slice(0, 200),
    childCount: envelope.children.length,
    currency: envelope.currency,
    visibility: envelope.visibility,
    self: {
      budgetByCurrency: metrics.selfBudgeted,
      activityByCurrency: metrics.selfActivity,
      availableByCurrency: metrics.selfAvailable,
      transactionCount: metrics.selfTransactionCount,
    },
    withChildren: {
      budgetByCurrency: metrics.totalBudgeted,
      activityByCurrency: metrics.totalActivity,
      availableByCurrency: metrics.totalAvailable,
      transactionCount: metrics.totalTransactionCount,
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

function compareNameAndId(
  left: { name: string; id: string },
  right: { name: string; id: string }
): number {
  return left.name.localeCompare(right.name) || left.id.localeCompare(right.id)
}

import {
  createZerroSession,
  type TTransactionFilterClause,
} from 'zerro-core/headless'

import type { TToolContext } from './context'
import { ToolError, success } from './output'
import { page, parseLimit } from './pagination'
import { resolveEntityId, resolveEntityIds } from './resolve'
import {
  loadWorkspace,
  workspaceMeta,
  type TWorkspace,
} from '../adapters/stateFile'

export type TReadOptions = Record<string, string | undefined>

export async function listAccounts(
  context: TToolContext,
  options: TReadOptions
) {
  const command = 'accounts list'
  const workspace = await loadWorkspace(context, command)
  const limit = parseLimit(options.limit, command)
  const rows = Object.values(workspace.current.account)
    .sort(compareTitleAndId)
    .map(account => {
      const instrument = workspace.current.instrument[account.instrument]
      return {
        id: account.id,
        title: account.title,
        type: account.type,
        archive: account.archive,
        inBalance: account.inBalance,
        canonicalBalance: account.balance,
        balancePendingCanonicalSync: workspace.state.outbox.length > 0,
        instrument: instrument
          ? {
              id: instrument.id,
              code: instrument.shortTitle,
              symbol: instrument.symbol,
            }
          : { id: account.instrument, code: '', symbol: '' },
      }
    })
  return readSuccess(
    context,
    workspace,
    command,
    page(rows, {
      command,
      revision: workspace.revision,
      query: {},
      limit,
      cursor: options.cursor,
    })
  )
}

export async function searchTags(context: TToolContext, options: TReadOptions) {
  const command = 'tags search'
  const workspace = await loadWorkspace(context, command)
  const query = normalizeQuery(options.query)
  const limit = parseLimit(options.limit, command)
  const rows = Object.values(workspace.current.tag)
    .filter(tag => tag.title.toLocaleLowerCase().includes(query))
    .sort(compareTitleAndId)
    .map(tag => ({
      id: tag.id,
      title: tag.title,
      parentId: tag.parent,
      icon: tag.icon,
      archive: tag.archive ?? false,
      showIncome: tag.showIncome,
      showOutcome: tag.showOutcome,
    }))
  return readSuccess(
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

export async function searchMerchants(
  context: TToolContext,
  options: TReadOptions
) {
  const command = 'merchants search'
  const workspace = await loadWorkspace(context, command)
  const query = normalizeQuery(options.query)
  const limit = parseLimit(options.limit, command)
  const rows = Object.values(workspace.current.merchant)
    .filter(merchant => merchant.title.toLocaleLowerCase().includes(query))
    .sort(compareTitleAndId)
    .map(merchant => ({ id: merchant.id, title: merchant.title }))
  return readSuccess(
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

export async function searchTransactions(
  context: TToolContext,
  options: TReadOptions
) {
  const command = 'transactions search'
  const workspace = await loadWorkspace(context, command)
  const limit = parseLimit(options.limit, command)
  const query = normalizeQuery(options.query)
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
  const accountId = options.account
    ? resolveEntityId(workspace.current.account, options.account, {
        command,
        option: 'accountId',
        entityLabel: 'Account',
      })
    : undefined
  const tagIds = options.tag
    ? resolveEntityIds(workspace.current.tag, options.tag, {
        command,
        option: 'tagId',
        entityLabel: 'Tag',
      })
    : undefined
  const merchantIds = options.merchant
    ? resolveEntityIds(workspace.current.merchant, options.merchant, {
        command,
        option: 'merchantId',
        entityLabel: 'Merchant',
      })
    : undefined

  const clauses: TTransactionFilterClause[] = []
  if (query) clauses.push({ kind: 'search', value: query })
  if (accountId) clauses.push({ kind: 'account', ids: [accountId] })
  if (tagIds?.length) clauses.push({ kind: 'tag', ids: tagIds })
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
  const merchantIdSet = merchantIds ? new Set(merchantIds) : undefined
  const rows = session.transactions
    .query({ clauses })
    .filter(
      transaction =>
        !merchantIdSet ||
        (transaction.merchant !== null &&
          merchantIdSet.has(transaction.merchant))
    )
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) || left.id.localeCompare(right.id)
    )
    .map(transaction => ({
      id: transaction.id,
      date: transaction.date,
      type: transactionType(transaction, routing.debtAccountId),
      income: moneySide(
        workspace,
        transaction.income,
        transaction.incomeAccount,
        transaction.incomeInstrument
      ),
      outcome: moneySide(
        workspace,
        transaction.outcome,
        transaction.outcomeAccount,
        transaction.outcomeInstrument
      ),
      tags: (transaction.tag ?? []).slice(0, 50).map(id => ({
        id,
        title: workspace.current.tag[id]?.title ?? '',
      })),
      tagCount: transaction.tag?.length ?? 0,
      merchant: transaction.merchant
        ? {
            id: transaction.merchant,
            title:
              workspace.current.merchant[transaction.merchant]?.title ?? '',
          }
        : null,
      payee: transaction.payee,
      comment: transaction.comment,
      deleted: transaction.deleted,
      viewed: transaction.viewed ?? false,
    }))
  return readSuccess(
    context,
    workspace,
    command,
    page(rows, {
      command,
      revision: workspace.revision,
      query: {
        query,
        from: options.from ?? null,
        to: options.to ?? null,
        account: accountId ?? null,
        tags: tagIds ?? null,
        merchants: merchantIds ?? null,
      },
      limit,
      cursor: options.cursor,
    })
  )
}

function moneySide(
  workspace: TWorkspace,
  amount: number,
  accountId: string,
  instrumentId: number
) {
  const account = workspace.current.account[accountId]
  const instrument = workspace.current.instrument[instrumentId]
  return {
    amount,
    account: { id: accountId, title: account?.title ?? '' },
    instrument: {
      id: instrumentId,
      code: instrument?.shortTitle ?? '',
      symbol: instrument?.symbol ?? '',
    },
  }
}

export function transactionType(
  transaction: {
    income: number
    outcome: number
    incomeAccount: string
    outcomeAccount: string
  },
  debtAccountId: string | undefined
) {
  if (
    debtAccountId &&
    transaction.outcomeAccount === debtAccountId &&
    transaction.incomeAccount !== debtAccountId
  )
    return 'incomeDebt'
  if (
    debtAccountId &&
    transaction.incomeAccount === debtAccountId &&
    transaction.outcomeAccount !== debtAccountId
  )
    return 'outcomeDebt'
  if (
    transaction.income > 0 &&
    transaction.outcome > 0 &&
    transaction.incomeAccount !== transaction.outcomeAccount
  )
    return 'transfer'
  return transaction.income > 0 ? 'income' : 'outcome'
}

function readSuccess<T>(
  context: TToolContext,
  workspace: TWorkspace,
  command: string,
  data: T
) {
  return success(command, 'none', workspaceMeta(workspace, context.now()), data)
}

function normalizeQuery(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? ''
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

function compareTitleAndId(
  left: { title: string; id: string | number },
  right: { title: string; id: string | number }
): number {
  return (
    left.title.localeCompare(right.title) ||
    String(left.id).localeCompare(String(right.id))
  )
}

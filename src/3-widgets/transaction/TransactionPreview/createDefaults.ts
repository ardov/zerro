import { core } from '@/zerro-core/redux'
import {
  getMonthLength,
  parseDate,
  toISODate,
  toISOMonth,
} from '@/6-shared/helpers/date'
import type { TCreateDraftDefaults, TDraftType } from './draft'

export function createDefaultsFromQuery(
  query: core.transactions.TTransactionQuery,
  now = Date.now()
): TCreateDraftDefaults {
  const account = query.clauses.find(clause => clause.kind === 'account')
  const tag = query.clauses.find(clause => clause.kind === 'tag')
  const type = query.clauses.find(clause => clause.kind === 'type')
  const amount = query.clauses.find(clause => clause.kind === 'amount')
  const date = query.clauses.find(clause => clause.kind === 'date')
  const activity = query.clauses.find(clause => clause.kind === 'activity')
  const activityEnvelope =
    activity?.envelopeIds.length === 1
      ? core.envelopes.envId.parse(activity.envelopeIds[0])
      : undefined
  const activityType =
    activity?.mode === core.transactions.TrFilterMode.Income ||
    activity?.mode === core.transactions.TrFilterMode.GeneralIncome
      ? core.transactions.TrType.Income
      : activity?.mode === core.transactions.TrFilterMode.Outcome ||
          activity?.mode === core.transactions.TrFilterMode.Envelope
        ? core.transactions.TrType.Outcome
        : undefined
  const exactType =
    type?.values.length === 1 && type.values[0] !== 'debt'
      ? (type.values[0] as TDraftType)
      : undefined

  return {
    account: account?.ids[0],
    tag: tag
      ? tag.ids.filter(id => id !== 'null')
      : activityEnvelope?.type === core.envelopes.EnvType.Tag
        ? activityEnvelope.id === 'null'
          ? null
          : [activityEnvelope.id]
        : undefined,
    type: exactType ?? activityType,
    amount:
      // The draft account owns its currency; do not copy a foreign amount
      // before an account in that currency has been selected.
      !amount?.currencies?.length &&
      amount?.gte !== undefined &&
      amount.gte === amount.lte
        ? amount.gte
        : undefined,
    date: creationDate(date, Boolean(activity), now),
  }
}

function creationDate(
  date:
    | Extract<core.transactions.TTransactionFilterClause, { kind: 'date' }>
    | undefined,
  budgetActivity: boolean,
  now: number
) {
  if (!date) return undefined
  const { from, to } = core.transactions.normalizeDateFilter(date)
  if (from && from === to) return from
  if (!budgetActivity) return undefined

  // A budget month starts a draft on today's day of that month. An edited
  // range must also contain the draft date, including across month boundaries.
  let day = toISODate(now)
  if (from && to && toISOMonth(from) === toISOMonth(to)) {
    const candidate = parseDate(from)
    candidate.setDate(Math.min(new Date(now).getDate(), getMonthLength(from)))
    day = toISODate(candidate)
  }
  if (from && day < from) return from
  if (to && day > to) return to
  return day
}

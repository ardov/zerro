import { core } from '@/zerro-core/redux'
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
      amount?.gte !== undefined && amount.gte === amount.lte
        ? amount.gte
        : undefined,
    date:
      date?.from !== undefined && date.from === date.to
        ? date.from
        : activity?.month
          ? dateInMonth(activity.month, now)
          : undefined,
  }
}

function dateInMonth(month: string, now: number) {
  const current = new Date(now)
  const [year, monthIndex] = month.split('-').map(Number)
  const lastDay = new Date(year, monthIndex, 0).getDate()
  const day = String(Math.min(current.getDate(), lastDay)).padStart(2, '0')
  return `${month}-${day}` as TCreateDraftDefaults['date']
}

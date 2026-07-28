import { toISODate } from '../../../foundation/date'
import type { Modify, OptionalExceptFor } from '../../../foundation/types'
import type { TCoreContext } from '../../../../../types'
import type { TDateDraft } from '../../primitives'
import type { TTransaction, TTransactionId } from './types'

export type TTransactionFactoryDraft = Modify<
  OptionalExceptFor<
    TTransaction,
    | 'user'
    | 'date'
    | 'incomeInstrument'
    | 'incomeAccount'
    | 'outcomeInstrument'
    | 'outcomeAccount'
  >,
  {
    date: TDateDraft
    changed?: TDateDraft
    created?: TDateDraft
  }
>

export function makeTransaction(
  draft: TTransactionFactoryDraft,
  ctx: TCoreContext
): TTransaction {
  return {
    id: draft.id || (ctx.uuid() as TTransactionId),
    changed: toTimestamp(draft.changed, ctx),
    created: toTimestamp(draft.created, ctx),
    user: draft.user,
    deleted: draft.deleted ?? false,
    hold: draft.hold === undefined ? false : draft.hold,
    // ZenMoney stores `viewed: true` when a write omits the field, and a
    // transaction the user just entered here is not an unseen bank import.
    viewed: draft.viewed ?? true,
    source: draft.source ?? null,

    qrCode: draft.qrCode ?? null,

    income: draft.income ?? 0,
    incomeInstrument: draft.incomeInstrument,
    incomeAccount: draft.incomeAccount,
    incomeBankID: draft.incomeBankID ?? null,

    outcome: draft.outcome ?? 0,
    outcomeInstrument: draft.outcomeInstrument,
    outcomeAccount: draft.outcomeAccount,
    outcomeBankID: draft.outcomeBankID ?? null,

    opIncome: draft.opIncome === undefined ? 0 : draft.opIncome,
    opIncomeInstrument: draft.opIncomeInstrument ?? null,
    opOutcome: draft.opOutcome === undefined ? 0 : draft.opOutcome,
    opOutcomeInstrument: draft.opOutcomeInstrument ?? null,

    tag: draft.tag ?? null,
    date: toISODate(draft.date),
    mcc: draft.mcc ?? null,
    comment: draft.comment ?? null,
    payee: draft.payee ?? null,
    originalPayee: draft.originalPayee ?? null,
    merchant: draft.merchant ?? null,
    latitude: draft.latitude ?? null,
    longitude: draft.longitude ?? null,
    reminderMarker: draft.reminderMarker ?? null,
  }
}

function toTimestamp(
  date: TDateDraft | undefined,
  ctx: Pick<TCoreContext, 'now'>
): number {
  return +new Date(date ?? ctx.now())
}

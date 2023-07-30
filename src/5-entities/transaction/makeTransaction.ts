import { v1 as uuidv1 } from 'uuid'
import { toISODate } from '6-shared/helpers/date'
import { Modify, OptionalExceptFor, TDateDraft } from '6-shared/types'
import { TTransaction } from '6-shared/types'

type TransactionDraft = Modify<
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

export function makeTransaction(draft: TransactionDraft): TTransaction {
  return {
    id: draft.id || uuidv1(),
    changed: +new Date(draft.changed || Date.now()),
    created: +new Date(draft.created || Date.now()),
    user: draft.user,
    deleted: draft.deleted || false,
    hold: draft.hold || false,
    viewed: draft.viewed || false,

    qrCode: draft.qrCode || null,

    income: draft.income || 0,
    incomeInstrument: draft.incomeInstrument,
    incomeAccount: draft.incomeAccount,
    incomeBankID: draft.incomeBankID || null,

    outcome: draft.outcome || 0,
    outcomeInstrument: draft.outcomeInstrument,
    outcomeAccount: draft.outcomeAccount,
    outcomeBankID: draft.outcomeBankID || null,

    opIncome: draft.opIncome || 0,
    opIncomeInstrument: draft.opIncomeInstrument || null,
    opOutcome: draft.opOutcome || 0,
    opOutcomeInstrument: draft.opOutcomeInstrument || null,

    tag: draft.tag || null,
    date: toISODate(draft.date),
    mcc: draft.mcc || null,
    comment: draft.comment || null,
    payee: draft.payee || null,
    originalPayee: draft.originalPayee || null,
    merchant: draft.merchant || null,
    latitude: draft.latitude || null,
    longitude: draft.longitude || null,
    reminderMarker: draft.reminderMarker || null,
  }
}

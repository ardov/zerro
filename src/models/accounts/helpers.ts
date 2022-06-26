import { v1 as uuidv1 } from 'uuid'
import {
  accountType,
  Modify,
  OptionalExceptFor,
  TAccountId,
  TDateDraft,
  TRawAccount,
} from 'shared/types'
import { toISODate } from 'shared/helpers/adapterUtils'

type TAccountDraft = Modify<
  OptionalExceptFor<TRawAccount, 'user' | 'instrument' | 'title'>,
  { startDate?: TDateDraft }
>

export function makeAccount(draft: TAccountDraft): TRawAccount {
  return {
    // Required
    user: draft.user,
    instrument: draft.instrument,
    title: draft.title,

    // Optional
    id: draft.id || (uuidv1() as TAccountId),
    changed: draft.changed || Date.now(),
    role: draft.role || null,
    company: draft.company || null,
    type: draft.type || accountType.cash,
    syncID: draft.syncID || null,

    balance: draft.balance || 0,
    startBalance: draft.startBalance || 0,
    creditLimit: draft.creditLimit || 0,

    inBalance: draft.inBalance || false,
    savings: draft.savings || false,
    enableCorrection: draft.enableCorrection || false,
    enableSMS: draft.enableSMS || false,
    archive: draft.archive || false,
    private: draft.private || false,

    // Для счетов с типом отличных от 'loan' и 'deposit' в  этих полях можно ставить null
    capitalization: draft.capitalization || null,
    percent: draft.percent || null,
    startDate: draft.startDate ? toISODate(draft.startDate) : null,
    endDateOffset: draft.endDateOffset || null,
    endDateOffsetInterval: draft.endDateOffsetInterval || null,
    payoffStep: draft.payoffStep || null,
    payoffInterval: draft.payoffInterval || null,
  }
}

export function getStartBalance(acc: TRawAccount): number {
  //  Для deposit и loan поле startBalance имеет смысл начального взноса/тела кредита
  if (acc.type === accountType.deposit) return 0
  if (acc.type === accountType.loan) return 0
  return acc.startBalance
}

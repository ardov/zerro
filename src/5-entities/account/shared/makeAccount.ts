import { v1 as uuidv1 } from 'uuid'
import { toISODate } from '6-shared/helpers/date'
import { Modify, OptionalExceptFor, TDateDraft } from '6-shared/types'
import { TAccount, TAccountId, AccountType } from '6-shared/types'

export type TAccountDraft = Modify<
  OptionalExceptFor<TAccount, 'user' | 'instrument' | 'title'>,
  { startDate?: TDateDraft }
>

export function makeAccount(draft: TAccountDraft): TAccount {
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
    type: draft.type || AccountType.Cash,
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

import type {
  TAccountId,
  TInstrumentId,
  TISODate,
  TMerchantId,
  TTagId,
  TTransaction,
  TTransactionEditablePatch,
} from '@/6-shared/types'
import { formatDate, parseDate, toISODate } from '@/6-shared/helpers/date'
import { core } from '@/zerro-core/redux'

/** What a transaction editor is editing.
 *
 * A draft is not a transaction: it holds a transfer's two sides *and* a
 * one-sided operation's single side at once, whichever type is selected. That
 * is what makes switching type non-destructive — a category chosen for an
 * expense survives a detour through a transfer, and so do the accounts.
 *
 * Nothing here knows about a source transaction. A draft can be read off one
 * (`toDraft`) or started from nothing (`emptyDraft`), and what it is worth
 * (`toPatch`) is the same question either way. Only the three functions under
 * "Against a source" compare it with the transaction it came from. */
export type TDraftType = `${core.transactions.TrType}`

/** A merchant that exists is `{ id }`; one the save still has to create is
 * `{ title }`. */
export type TDraftMerchant = { id: TMerchantId } | { title: string } | null

export type TTransactionDraft = {
  type: TDraftType
  /** The account a one-sided operation touches: an expense's, an income's, or
   * the real account a debt is settled through. */
  account: TAccountId
  /** What that operation is worth, in that account's currency. */
  amount: number
  /** A transfer's two sides. */
  fromAccount: TAccountId
  toAccount: TAccountId
  fromAmount: number
  toAmount: number
  /** Categories. Only an income or an expense sends them; the others keep
   * them so that coming back restores them. */
  tag: TTagId[] | null
  /** Who the operation is with. */
  merchant: TDraftMerchant
  /** The free text beside the merchant. An old transaction can carry one with
   * no merchant at all, and leaving both alone is what keeps it that way. */
  payee: string | null
  comment: string | null
  date: TISODate
  /** `HH:mm`. */
  time: string
}

/** What the draft cannot work out on its own: which accounts exist, what
 * currency each is in, and which one holds debts. */
export type TDraftContext = {
  /** Selectable accounts, in the order a picker offers them. */
  accountIds: TAccountId[]
  instrumentOf: (id: TAccountId) => TInstrumentId | undefined
  /** The user's debt account. A replica always has exactly one —
   * `validateStore` refuses a store that does not — so this is optional only
   * because the selector that reads it says so. */
  debtAccountId?: TAccountId
}

const { TrType } = core.transactions

// ---------------------------------------------------------------------------
// Making one
// ---------------------------------------------------------------------------

/** A draft with nothing in it yet, for composing a transaction rather than
 * editing one. */
export function emptyDraft(ctx: TDraftContext, now: number): TTransactionDraft {
  const account = ctx.accountIds[0] ?? ''
  return {
    type: TrType.Outcome,
    account,
    amount: 0,
    fromAccount: account,
    toAccount: otherAccount(account, ctx),
    fromAmount: 0,
    toAmount: 0,
    tag: null,
    merchant: null,
    payee: null,
    comment: null,
    date: toISODate(now),
    time: formatDate(now, 'HH:mm'),
  }
}

/** Reads a transaction as a draft. Both sides are filled in whatever the type
 * is, so the first switch has something to switch to. */
export function toDraft(
  tr: TTransaction,
  ctx: Pick<TDraftContext, 'accountIds' | 'debtAccountId'>
): TTransactionDraft {
  const type = core.transactions.getType(tr, ctx.debtAccountId)
  // A soft-deleted row can have a leg with no account at all. The empty
  // string stands in for it, and nothing downstream can find a currency for
  // it, so such a draft refuses to build legs rather than inventing one.
  const outcomeAccount = tr.outcomeAccount ?? tr.incomeAccount ?? ''
  const incomeAccount = tr.incomeAccount ?? tr.outcomeAccount ?? ''

  const single = isIncoming(type)
    ? { account: incomeAccount, amount: tr.income }
    : { account: outcomeAccount, amount: tr.outcome }

  // A transfer states its two sides. Anything else has one account, so the
  // other side is the first account that is not it — the same choice
  // switching to a transfer would make.
  const transfer =
    type === TrType.Transfer
      ? {
          fromAccount: outcomeAccount,
          toAccount: incomeAccount,
          fromAmount: tr.outcome,
          toAmount: tr.income,
        }
      : {
          fromAccount: single.account,
          toAccount: otherAccount(single.account, ctx),
          fromAmount: single.amount,
          toAmount: single.amount,
        }

  return {
    type,
    ...single,
    ...transfer,
    tag: tr.tag,
    merchant: tr.merchant ? { id: tr.merchant } : null,
    payee: tr.payee,
    comment: tr.comment,
    date: tr.date,
    time: formatDate(tr.created, 'HH:mm'),
  }
}

// ---------------------------------------------------------------------------
// Editing one
// ---------------------------------------------------------------------------

/** Switches the type, carrying over as much as the new type can hold.
 *
 * Both sides are kept, so only the crossing between them moves anything:
 * leaving a transfer picks the side the new type cares about, and entering
 * one seeds it from the side that was being edited. */
export function setDraftType(
  draft: TTransactionDraft,
  type: TDraftType,
  ctx: TDraftContext
): TTransactionDraft {
  if (type === draft.type) return draft

  if (type === TrType.Transfer) {
    const fromAccount = draft.account
    const toAccount =
      draft.toAccount && draft.toAccount !== fromAccount
        ? draft.toAccount
        : otherAccount(fromAccount, ctx)
    const fromAmount = draft.amount || draft.fromAmount
    return {
      ...draft,
      type,
      fromAccount,
      toAccount,
      fromAmount,
      // One currency makes the two sides one number. Two make them two, and
      // the second is whatever the transfer last had rather than a conversion
      // nothing here knows the rate for.
      toAmount: sameCurrency(fromAccount, toAccount, ctx)
        ? fromAmount
        : draft.toAmount || fromAmount,
    }
  }

  if (draft.type === TrType.Transfer) {
    // Money arrives on the receiving account and leaves the paying one, so
    // which side survives is the direction of the new type.
    const arriving = isIncoming(type)
    return {
      ...draft,
      type,
      account: arriving ? draft.toAccount : draft.fromAccount,
      amount: arriving ? draft.toAmount : draft.fromAmount,
    }
  }

  return { ...draft, type }
}

/** Names who the operation is with. The merchant is the link and `payee` the
 * text every other client reads, so naming one names both. */
export function setDraftMerchant(
  draft: TTransactionDraft,
  named: { id?: TMerchantId; title: string } | null
): TTransactionDraft {
  const title = named?.title.trim()
  if (!named || !title) return { ...draft, merchant: null, payee: null }
  return {
    ...draft,
    merchant: named.id ? { id: named.id } : { title },
    payee: named.title,
  }
}

/** Turns a transfer around: accounts and amounts change places together, so
 * the operation keeps meaning what it meant. */
export function swapTransferSides(draft: TTransactionDraft): TTransactionDraft {
  return {
    ...draft,
    fromAccount: draft.toAccount,
    toAccount: draft.fromAccount,
    fromAmount: draft.toAmount,
    toAmount: draft.fromAmount,
  }
}

/** Sets one side of a transfer's amount, and follows it with the other when
 * the two are one number rather than two.
 *
 * One currency on both ends makes them one: 500 roubles into roubles cannot
 * be 500 out and 400 in. Across currencies they are two even when they read
 * the same — 100 → 100 between roubles and euros is a placeholder, and the
 * first real figure typed into one side is the one that must not be copied
 * over the other. */
export function setTransferAmount(
  draft: TTransactionDraft,
  side: 'from' | 'to',
  amount: number,
  ctx: TDraftContext
): TTransactionDraft {
  const mirrored = sameCurrency(draft.fromAccount, draft.toAccount, ctx)
  if (side === 'from') {
    return {
      ...draft,
      fromAmount: amount,
      toAmount: mirrored ? amount : draft.toAmount,
    }
  }
  return {
    ...draft,
    toAmount: amount,
    fromAmount: mirrored ? amount : draft.fromAmount,
  }
}

/** Picks a transfer account, keeping the two ends different: choosing the
 * account already on the other end swaps the two rather than refusing. */
export function setTransferAccount(
  draft: TTransactionDraft,
  side: 'from' | 'to',
  account: TAccountId,
  ctx: TDraftContext
): TTransactionDraft {
  const other = side === 'from' ? draft.toAccount : draft.fromAccount
  const next =
    account === other
      ? swapTransferSides(draft)
      : side === 'from'
        ? { ...draft, fromAccount: account }
        : { ...draft, toAccount: account }
  // The currencies may have just come together, and then the two amounts are
  // one number again.
  return sameCurrency(next.fromAccount, next.toAccount, ctx)
    ? { ...next, toAmount: next.fromAmount }
    : next
}

// ---------------------------------------------------------------------------
// What it is worth
// ---------------------------------------------------------------------------

/** The two legs: an account, a currency and an amount each. Required, because
 * a draft always knows all six. */
export type TDraftLegs = Required<
  Pick<
    TTransactionEditablePatch,
    | 'incomeAccount'
    | 'incomeInstrument'
    | 'income'
    | 'outcomeAccount'
    | 'outcomeInstrument'
    | 'outcome'
  >
>

/** The two legs the draft describes.
 *
 * This is where each type stops being a label: an expense pays itself, a
 * transfer has two ends, and a debt is a transfer with the debt account on
 * whichever end the direction puts it. A debt's legs carry the same amount
 * and the same currency as the real account — the debt account holds debts in
 * every currency, so it imposes none. */
export function toLegs(
  draft: TTransactionDraft,
  ctx: TDraftContext
): TDraftLegs | null {
  if (draft.type === TrType.Transfer) {
    const outcomeInstrument = ctx.instrumentOf(draft.fromAccount)
    const incomeInstrument = ctx.instrumentOf(draft.toAccount)
    if (outcomeInstrument === undefined || incomeInstrument === undefined) {
      return null
    }
    return {
      outcomeAccount: draft.fromAccount,
      outcomeInstrument,
      outcome: draft.fromAmount,
      incomeAccount: draft.toAccount,
      incomeInstrument,
      income: draft.toAmount,
    }
  }

  const instrument = ctx.instrumentOf(draft.account)
  if (instrument === undefined) return null

  if (!isDebt(draft.type)) {
    const paid = draft.type === TrType.Outcome
    return {
      outcomeAccount: draft.account,
      outcomeInstrument: instrument,
      outcome: paid ? draft.amount : 0,
      incomeAccount: draft.account,
      incomeInstrument: instrument,
      income: paid ? 0 : draft.amount,
    }
  }

  if (!ctx.debtAccountId) return null
  const lent = draft.type === TrType.OutcomeDebt
  return {
    outcomeAccount: lent ? draft.account : ctx.debtAccountId,
    outcomeInstrument: instrument,
    outcome: draft.amount,
    incomeAccount: lent ? ctx.debtAccountId : draft.account,
    incomeInstrument: instrument,
    income: draft.amount,
  }
}

/** Every field the draft claims. */
export function toPatch(
  draft: TTransactionDraft,
  ctx: TDraftContext
): (TTransactionEditablePatch & TDraftLegs) | null {
  const legs = toLegs(draft, ctx)
  if (!legs) return null
  const merchant = claimedMerchant(draft)
  return {
    ...legs,
    tag: isCategorized(draft.type) ? nonEmpty(draft.tag) : null,
    // A merchant that does not exist yet has no id to claim. Leaving the key
    // out says nothing about it; `newMerchantTitle` is what the save acts on.
    ...(merchant !== undefined && { merchant }),
    payee: emptyToNull(draft.payee),
    comment: emptyToNull(draft.comment),
    date: draft.date,
  }
}

/** The merchant a save has to create before the transaction can point at it.
 * A draft that names no new one answers `null`. */
export function newMerchantTitle(draft: TTransactionDraft): string | null {
  const { merchant } = draft
  return merchant && 'title' in merchant ? merchant.title : null
}

/** The merchant the patch may claim: an id, `null` for nobody, and
 * `undefined` while it is still only a title. */
function claimedMerchant(
  draft: TTransactionDraft
): TMerchantId | null | undefined {
  const { merchant } = draft
  if (!merchant) return null
  return 'id' in merchant ? merchant.id : undefined
}

/** The moment a transaction claims it was created at, from the draft's date
 * and time of day. `fallback` answers for a time input that has been cleared. */
export function draftCreated(
  draft: TTransactionDraft,
  fallback: number
): number {
  const [hours, minutes] = draft.time.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallback
  const created = parseDate(draft.date)
  created.setHours(hours, minutes, 0, 0)
  return +created
}

// ---------------------------------------------------------------------------
// Against a source
// ---------------------------------------------------------------------------

/** The original-currency amounts to drop, for a leg the draft has moved.
 *
 * `opOutcome` records what a card was actually charged abroad. Once the leg
 * is a different account, a different currency or a different number, that
 * record is about a transaction this one no longer is. */
export function staleRates(
  legs: TDraftLegs,
  tr: TTransaction
): TTransactionEditablePatch {
  const moved = (leg: 'income' | 'outcome') =>
    legs[`${leg}Account`] !== tr[`${leg}Account`] ||
    legs[`${leg}Instrument`] !== tr[`${leg}Instrument`] ||
    legs[leg] !== tr[leg]
  return {
    ...(moved('outcome') && { opOutcome: null, opOutcomeInstrument: null }),
    ...(moved('income') && { opIncome: null, opIncomeInstrument: null }),
  }
}

/** Only the fields the patch actually changes. An `update` of nothing is
 * still a command in the outbox, so a save that changes one field says one
 * field. */
export function changedFields(
  tr: TTransaction,
  patch: TTransactionEditablePatch
): TTransactionEditablePatch {
  const changed: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if (!sameValue(tr[key as keyof TTransaction], value)) changed[key] = value
  }
  return changed as TTransactionEditablePatch
}

/** `created` is immutable on the server, so a changed time is a different
 * transaction — which is why the editor recreates rather than updates when
 * this moves. */
export function timeChanged(
  draft: TTransactionDraft,
  tr: TTransaction
): boolean {
  return draft.time !== formatDate(tr.created, 'HH:mm')
}

// ---------------------------------------------------------------------------
// What is wrong with it
// ---------------------------------------------------------------------------

/** A field a mark can be put on. */
export type TDraftField =
  'amount' | 'fromAmount' | 'toAmount' | 'fromAccount' | 'toAccount' | 'payee'

/** Why that field is wrong. */
export type TDraftIssue = 'amount' | 'sameAccount' | 'debtor'

export type TDraftIssues = Partial<Record<TDraftField, TDraftIssue>>

/** Everything wrong with the draft, by the field it is wrong on.
 *
 * By field rather than one answer for the whole draft, because that is how it
 * is shown: the mark sits beside the field it is about, and a transfer has
 * two amounts that can each be the empty one.
 *
 * It needs no context. A replica always has exactly one debt account —
 * `validateStore` refuses a store that does not — so there is no such thing
 * as a debt with nowhere to record it. */
export function draftIssues(draft: TTransactionDraft): TDraftIssues {
  if (draft.type === TrType.Transfer) {
    const sameAccount = draft.fromAccount === draft.toAccount
    return {
      ...(sameAccount && {
        fromAccount: 'sameAccount' as const,
        toAccount: 'sameAccount' as const,
      }),
      ...(draft.fromAmount <= 0 && { fromAmount: 'amount' as const }),
      ...(draft.toAmount <= 0 && { toAmount: 'amount' as const }),
    }
  }
  return {
    ...(draft.amount <= 0 && { amount: 'amount' as const }),
    // A debt is owed by somebody. Nothing else here needs a name.
    ...(isDebt(draft.type) &&
      !emptyToNull(draft.payee) &&
      !draft.merchant && { payee: 'debtor' as const }),
  }
}

export function hasIssues(issues: TDraftIssues): boolean {
  return Object.keys(issues).length > 0
}

// ---------------------------------------------------------------------------

export function isDebt(type: TDraftType): boolean {
  return type === TrType.IncomeDebt || type === TrType.OutcomeDebt
}

/** Whether the type puts money on the account or takes it off, which is the
 * sign the amount is shown with. */
export function isIncoming(type: TDraftType): boolean {
  return type === TrType.Income || type === TrType.IncomeDebt
}

/** Only an income and an expense carry categories. */
export function isCategorized(type: TDraftType): boolean {
  return type === TrType.Income || type === TrType.Outcome
}

function otherAccount(
  account: TAccountId,
  ctx: Pick<TDraftContext, 'accountIds'>
): TAccountId {
  return ctx.accountIds.find(id => id !== account) ?? account
}

function sameCurrency(
  a: TAccountId,
  b: TAccountId,
  ctx: TDraftContext
): boolean {
  const first = ctx.instrumentOf(a)
  return first !== undefined && first === ctx.instrumentOf(b)
}

function nonEmpty(tags: TTagId[] | null): TTagId[] | null {
  return tags && tags.length ? tags : null
}

function emptyToNull(value: string | null): string | null {
  return value?.trim() || null
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => item === b[i])
  }
  return a === b
}

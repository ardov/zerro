import { parseDate, toISODate } from '../../foundation/date'
import type { TISODate } from '../primitives'
import type { TAccountId } from '../entities/accounts'
import { normalizePayee, type TMerchantId } from '../entities/merchants'
import { getTransactionType, TrType } from '../entities/transactions'
import type { TTransaction } from '../entities/transactions/types'

/** How a merchant has been used, so a picker can offer the ones that suit the
 * operation being edited and rank the rest. */
export type TMerchantUsage = {
  regular: boolean
  debt: boolean
  /** Uses within the last 30 days. */
  recentUses: number
  searchTerms?: {
    payee: string[]
    originalPayee: string[]
  }
}

export type TMerchantUsageById = Record<TMerchantId, TMerchantUsage>

export type TBuildMerchantUsageInput = {
  transactions: TTransaction[]
  currentDate: TISODate
  debtAccountId?: TAccountId
}

const recentDays = 30

export function buildMerchantUsage({
  transactions,
  currentDate,
  debtAccountId,
}: TBuildMerchantUsageInput): TMerchantUsageById {
  const since = daysBefore(currentDate, recentDays)
  const usage: TMerchantUsageById = {}

  transactions.forEach(transaction => {
    if (!transaction.merchant) return
    const entry = (usage[transaction.merchant] ??= {
      regular: false,
      debt: false,
      recentUses: 0,
    })

    const type = getTransactionType(transaction, debtAccountId)
    if (type === TrType.IncomeDebt || type === TrType.OutcomeDebt) {
      entry.debt = true
    } else {
      entry.regular = true
    }

    if (transaction.date >= since) entry.recentUses++
    addSearchTerm(entry, 'payee', transaction.payee)
    addSearchTerm(entry, 'originalPayee', transaction.originalPayee)
  })

  return usage
}

function addSearchTerm(
  usage: TMerchantUsage,
  field: keyof NonNullable<TMerchantUsage['searchTerms']>,
  value: string | null
) {
  const term = normalizePayee(value)
  if (!term) return

  const terms = (usage.searchTerms ??= {
    payee: [],
    originalPayee: [],
  })[field]
  if (!terms.includes(term)) terms.push(term)
}

function daysBefore(date: TISODate, days: number): TISODate {
  const shifted = parseDate(date)
  shifted.setDate(shifted.getDate() - days)
  return toISODate(shifted)
}

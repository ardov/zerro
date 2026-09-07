import { parseDate, toISODate } from '../../foundation/date'
import type { TISODate } from '../primitives'
import type { TAccountId } from '../entities/accounts'
import { normalizePayee, type TMerchantId } from '../entities/merchants'
import { getTransactionType, TrType } from '../entities/transactions'
import type { TTransaction } from '../entities/transactions/types'
import { parse } from 'tldts'

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
  website?: {
    domain: string
    transactionCount: number
  }
}

export type TMerchantUsageById = Record<TMerchantId, TMerchantUsage>

export type TBuildMerchantUsageInput = {
  transactions: TTransaction[]
  currentDate: TISODate
  debtAccountId?: TAccountId
}

const recentDays = 30
const domainCandidate =
  /(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?/gu

export function buildMerchantUsage({
  transactions,
  currentDate,
  debtAccountId,
}: TBuildMerchantUsageInput): TMerchantUsageById {
  const since = daysBefore(currentDate, recentDays)
  const usage: TMerchantUsageById = {}
  const domainCounts: Record<TMerchantId, Map<string, number>> = {}

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

    const domains = new Set([
      ...extractWebsiteDomains(transaction.payee),
      ...extractWebsiteDomains(transaction.originalPayee),
    ])
    if (!domains.size) return

    const counts = (domainCounts[transaction.merchant] ??= new Map())
    domains.forEach(domain => counts.set(domain, (counts.get(domain) ?? 0) + 1))
  })

  Object.entries(domainCounts).forEach(([merchantId, counts]) => {
    const website = [...counts].sort(
      ([domainA, countA], [domainB, countB]) =>
        countB - countA || domainA.localeCompare(domainB)
    )[0]
    if (!website) return

    usage[merchantId].website = {
      domain: website[0],
      transactionCount: website[1],
    }
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

export function extractWebsiteDomains(value: string | null): string[] {
  if (!value) return []

  const domains = new Set<string>()
  for (const match of value.matchAll(domainCandidate)) {
    if (match.index && value[match.index - 1] === '@') continue
    const { domain, isIcann } = parse(match[0])
    if (domain && isIcann) domains.add(domain)
  }
  return [...domains]
}

export function findWebsiteDomain(...values: (string | null)[]) {
  for (const value of values) {
    const domain = extractWebsiteDomains(value)[0]
    if (domain) return domain
  }
  return undefined
}

function daysBefore(date: TISODate, days: number): TISODate {
  const shifted = parseDate(date)
  shifted.setDate(shifted.getDate() - days)
  return toISODate(shifted)
}

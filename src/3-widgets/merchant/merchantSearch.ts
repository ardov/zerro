import { searchQueries } from '@/6-shared/helpers/searchQueries'
import { core } from '@/zerro-core/redux'

type TSearchUsage = {
  searchTerms?: {
    payee: string[]
    originalPayee: string[]
  }
}

export const initialMerchantSearch = (
  hasMerchant: boolean,
  payee: string | null
) => (hasMerchant ? '' : (payee ?? ''))

/** Convert punctuation keys to letters before normalizing merchant names. */
export function merchantSearchQueries(query: string): string[] {
  return searchQueries(query).map(core.merchants.normalizePayee).filter(Boolean)
}

export function merchantMatchPriority(
  title: string,
  usage: TSearchUsage | undefined,
  queries: readonly string[]
): number {
  const matches = (term: string) =>
    queries.some(
      text => term.includes(text) || ` ${text} `.includes(` ${term} `)
    )
  if (matches(title)) return 0
  if (usage?.searchTerms?.payee.some(matches)) return 1
  if (usage?.searchTerms?.originalPayee.some(matches)) return 2
  return Number.POSITIVE_INFINITY
}

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

export function merchantMatchPriority(
  title: string,
  usage: TSearchUsage | undefined,
  query: string
): number {
  const matches = (term: string) =>
    term.includes(query) || ` ${query} `.includes(` ${term} `)
  if (matches(title)) return 0
  if (usage?.searchTerms?.payee.some(matches)) return 1
  if (usage?.searchTerms?.originalPayee.some(matches)) return 2
  return Number.POSITIVE_INFINITY
}

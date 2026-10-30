import type { TFunction } from 'i18next'
import type { TMerchant } from '@/6-shared/types'
import type { core } from '@/zerro-core/redux'

/** Merchant identity is exact. Old text-only payees offer an explicit search. */
export function counterpartyList(
  merchant: TMerchant | undefined,
  payee: string | null | undefined,
  t: TFunction<'transaction'>
):
  | { label: string; query: core.transactions.TTransactionQuery; title: string }
  | undefined {
  if (merchant)
    return {
      label: t('btnMerchantTransactions'),
      query: { clauses: [{ kind: 'merchant', ids: [merchant.id] }] },
      title: merchant.title,
    }
  const name = payee?.trim()
  if (name)
    return {
      label: t('btnSearchPayeeTransactions'),
      query: { clauses: [{ kind: 'search', value: name }] },
      title: t('counterpartySearch', { name }),
    }
}

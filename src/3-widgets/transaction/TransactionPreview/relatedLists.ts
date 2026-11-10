import type { TFunction } from 'i18next'
import type { TAccountId, TMerchant, TTransaction } from '@/6-shared/types'
import { formatAbsoluteTimestamp } from '@/6-shared/helpers/date'
import { core } from '@/zerro-core/redux'

export type TRelatedList = {
  id: 'debtor' | 'merchant' | 'payee' | 'category' | 'changed'
  label: string
  query: core.transactions.TTransactionQuery
  title: string
}

/** Lists a transaction can lead to, each opened over the surface showing it. */
export function relatedLists(
  tr: TTransaction,
  context: {
    merchants: Record<string, TMerchant>
    tagNames: Record<string, { name: string } | undefined>
    debtorNames: Record<string, string | undefined>
    debtAccountId: TAccountId | undefined
    t: TFunction<'transaction'>
  }
): TRelatedList[] {
  const { merchants, tagNames, debtorNames, debtAccountId, t } = context
  const lists: TRelatedList[] = []

  const type = core.transactions.getType(tr, debtAccountId)
  const debt =
    type === core.transactions.TrType.IncomeDebt ||
    type === core.transactions.TrType.OutcomeDebt
  const merchant: TMerchant | undefined = tr.merchant
    ? merchants[tr.merchant]
    : undefined
  const payee = tr.payee?.trim()
  // A debtor is one name, whether a merchant or an old text payee carries it.
  const debtor = debt ? core.debtors.getDebtorId(tr, merchants) : ''
  if (debtor)
    lists.push({
      id: 'debtor',
      label: t('sameDebtor'),
      query: { clauses: [{ kind: 'debtor', ids: [debtor] }] },
      title: debtorNames[debtor] ?? merchant?.title ?? payee ?? debtor,
    })
  // Merchant identity is exact. Old text-only payees offer an explicit search.
  else if (merchant)
    lists.push({
      id: 'merchant',
      label: t('samePlace'),
      query: { clauses: [{ kind: 'merchant', ids: [merchant.id] }] },
      title: merchant.title,
    })
  else if (payee)
    lists.push({
      id: 'payee',
      label: t('samePlace'),
      query: { clauses: [{ kind: 'search', value: payee }] },
      title: t('counterpartySearch', { name: payee }),
    })

  // The main category: the one a transaction is budgeted under.
  const tag = tr.tag?.[0]
  const category = tag ? tagNames[tag] : undefined
  if (tag && category)
    lists.push({
      id: 'category',
      label: t('sameCategory'),
      query: { clauses: [{ kind: 'tag', ids: [tag] }] },
      title: category.name,
    })

  // One sync or one bulk edit stamps everything it touches with one time.
  lists.push({
    id: 'changed',
    label: t('sameSync'),
    query: { clauses: [{ kind: 'changed', at: tr.changed }] },
    title: t('changedTogether', { date: formatAbsoluteTimestamp(tr.changed) }),
  })

  return lists
}

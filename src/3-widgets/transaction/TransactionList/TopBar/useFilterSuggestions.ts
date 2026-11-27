import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { core } from '@/zerro-core/redux'
import { useAppSelector } from '@/store'
import {
  buildFilterSuggestions,
  type SuggestionValue,
} from './filterSuggestions'
import { getTypeLabel } from './filterModel'

export function useFilterSuggestions(text: string) {
  const { t, i18n } = useTranslation('filterDrawer')
  const accounts = core.accounts.usePopulated()
  const tags = core.tags.usePopulated()
  const debtors = useAppSelector(core.debtors.selectOptions)
  const merchants = core.merchants.useAll()
  const usage = core.merchants.useUsage()
  const values = useMemo(() => {
    const result: SuggestionValue[] = []
    for (const account of Object.values(accounts)) {
      if (account.type === 'debt' || core.accounts.isZerroDataAccount(account))
        continue
      result.push({
        id: account.id,
        title: account.title,
        alternative: account.title + ' ' + account.fxCode,
        clause: { kind: 'account', ids: [account.id] },
      })
    }
    for (const category of Object.values(tags)) {
      result.push({
        id: category.id,
        title: category.name,
        alternative: category.title,
        clause: { kind: 'tag', ids: [category.id] },
      })
    }
    for (const [id, title] of Object.entries(debtors)) {
      result.push({ id, title, clause: { kind: 'debtor', ids: [id] } })
    }
    result.push({
      id: 'none',
      title: t('noMerchant'),
      clause: { kind: 'merchant', ids: [null] },
    })
    for (const merchant of Object.values(merchants)) {
      result.push({
        id: 'id:' + merchant.id,
        title: merchant.title,
        usage: usage[merchant.id],
        clause: { kind: 'merchant', ids: [merchant.id] },
      })
    }
    for (const value of Object.values(core.transactions.TrFilterType)) {
      result.push({
        id: value,
        title: getTypeLabel(value, t),
        clause: { kind: 'type', values: [value] },
      })
    }
    return result
  }, [accounts, tags, debtors, merchants, usage, t])
  return useMemo(
    () => buildFilterSuggestions(text, values, t, i18n.language),
    [text, values, t, i18n.language]
  )
}

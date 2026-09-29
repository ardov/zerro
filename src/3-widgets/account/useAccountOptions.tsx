import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { core } from '@/zerro-core/redux'
import { AccountIcon } from './AccountIcon'
import { accountChoices, type AccountChoicesOptions } from './model'
import type { SelectItem, SelectOption } from '@/6-shared/ui/kit/Select'
import type { SelectSearchOptions } from '@/6-shared/ui/kit/SelectSearch'

/** Select props for accounts. The option source is built once per account
 * set; search and archive grouping come from `accountChoices`. */
export function useAccountOptions(
  options: Pick<AccountChoicesOptions, 'selectedIds' | 'excludeIds'>,
  label: string
) {
  const { t } = useTranslation()
  const populated = core.accounts.usePopulated()
  const { accounts, items, byId } = useMemo(() => {
    const accounts = Object.values(populated).map(account => ({
      ...account,
      isService: core.accounts.isZerroDataAccount(account),
    }))
    const items = accounts.map((account): SelectOption<string> => ({
      value: account.id,
      label: account.title,
      start: <AccountIcon account={account} />,
      end: account.fxCode,
    }))
    const byId = new Map(items.map(item => [item.value, item]))
    return { accounts, items, byId }
  }, [populated])
  const search: SelectSearchOptions<string> = {
    label,
    showMoreLabel: t('accounts:showArchived'),
    filter: (_, query, { expanded }) => {
      const result = accountChoices(accounts, { ...options, query, expanded })
      const active: SelectOption<string>[] = []
      const archived: SelectOption<string>[] = []
      for (const account of result.items) {
        const item = byId.get(account.id)
        if (item) (account.archive ? archived : active).push(item)
      }
      const items: SelectItem<string>[] = [...active]
      if (archived.length) {
        items.push({
          type: 'group',
          id: 'archived',
          label: t('accounts:archived'),
          items: archived,
        })
      }
      return { items, hasMore: result.hasMore }
    },
  }
  return {
    items,
    search,
    emptyText: t('noAccountsFound'),
    popupMinWidth: 280,
  }
}

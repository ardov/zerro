import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { PopupController } from '@/6-shared/overlays'
import { MultiSelect } from '@/6-shared/ui/kit/MultiSelect'
import { Favicon } from '@/6-shared/ui/kit/Favicon'
import { PersonIcon, PlaceIcon } from '@/6-shared/ui/Icons'
import { core } from '@/zerro-core/redux'
import { merchantMatchPriority } from './merchantSearch'

const merchantKey = (id: string | null) =>
  id === null ? 'none' : `merchant:${id}`

/** Existing merchants only; creation and transaction-draft rules belong to MerchantField. */
export function MerchantMultiSelect({
  value,
  onChange,
  trigger,
  popup,
}: {
  value: Array<string | null>
  onChange: (ids: Array<string | null>) => void
  trigger: ReactElement
  popup: PopupController
}) {
  const { t } = useTranslation('filterDrawer')
  const merchants = core.merchants.useAll()
  const usage = core.merchants.useUsage()
  const items = [
    { value: 'none', label: t('noMerchant'), start: <PlaceIcon /> },
    ...Object.values(merchants)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map(merchant => ({
        value: merchantKey(merchant.id),
        label: merchant.title,
        start: (
          <Favicon
            domain={usage[merchant.id]?.website?.domain}
            fallback={
              usage[merchant.id]?.regular ? <PlaceIcon /> : <PersonIcon />
            }
          />
        ),
      })),
  ]
  return (
    <MultiSelect
      label={t('merchant')}
      trigger={trigger}
      popup={popup}
      items={items}
      value={value.map(merchantKey)}
      onChange={keys =>
        onChange(
          keys.map(key =>
            key === 'none' ? null : key.slice('merchant:'.length)
          )
        )
      }
      search={{
        label: t('findMerchant'),
        placeholder: t('findMerchant'),
        filter: (_options, text) => {
          const query = core.merchants.normalizePayee(text)
          if (!query) return { items: items }
          return {
            items: items
              .map(option => ({
                option,
                priority: merchantMatchPriority(
                  core.merchants.normalizePayee(option.label),
                  usage[option.value.slice('merchant:'.length)],
                  query
                ),
              }))
              .filter(match => Number.isFinite(match.priority))
              .sort((a, b) => a.priority - b.priority)
              .map(match => match.option),
          }
        },
      }}
    />
  )
}

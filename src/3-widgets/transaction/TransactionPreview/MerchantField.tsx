import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TMerchantId } from '@/6-shared/types'
import { AddIcon, PersonIcon, PlaceIcon } from '@/6-shared/ui/Icons'
import {
  Select,
  type SelectOption,
  type SelectProps,
} from '@/6-shared/ui/kit/Select'
import { core } from '@/zerro-core/redux'
import type { TDraftMerchant, TNamedMerchant } from './draft'
import { Favicon } from '@/6-shared/ui/kit/Favicon'
import { initialMerchantSearch, merchantMatchPriority } from './merchantSearch'

export type MerchantFieldProps = Pick<
  SelectProps,
  'invalid' | 'error' | 'disabled' | 'readOnly'
> & {
  merchant: TDraftMerchant
  /** Legacy text is preserved until the user explicitly chooses or clears. */
  payee: string | null
  originalPayee: string | null
  debt: boolean
  onChange: (named: TNamedMerchant | null) => void
  placeholder: string
  className?: string
}

const { normalizePayee } = core.merchants
// Prefix every persisted ID too, so transient choices cannot collide with one.
const merchantKey = (id: string) => `merchant:${id}`
const createKey = (title: string) => `create:${title}`

/** The kit owns selection mechanics; merchant history and draft intent stay here. */
export function MerchantField(props: MerchantFieldProps) {
  const {
    merchant,
    payee,
    originalPayee,
    debt,
    onChange,
    placeholder,
    ...restProps
  } = props
  const { t } = useTranslation('transaction')
  const merchants = core.merchants.useAll()
  const usage = core.merchants.useUsage()
  const all = useMemo(
    () =>
      Object.values(merchants).sort((a, b) => a.title.localeCompare(b.title)),
    [merchants]
  )
  const chosen = merchant && 'id' in merchant ? merchant.id : undefined
  const pending = merchant && 'title' in merchant ? merchant.title : undefined
  const shown = pending ?? (chosen && merchants[chosen]?.title) ?? payee ?? ''
  const unlinked = !merchant && !!payee
  const glyph = (id?: TMerchantId) =>
    (id ? usage[id]?.regular : !debt) ? (
      <PlaceIcon size={20} />
    ) : (
      <PersonIcon size={20} />
    )
  const toOption = (option: (typeof all)[number]): SelectOption => ({
    value: merchantKey(option.id),
    label: option.title,
    start: (
      <Favicon
        domain={usage[option.id]?.website?.domain}
        fallback={glyph(option.id)}
      />
    ),
  })
  const options = all.map(toOption)
  const value = chosen
    ? merchantKey(chosen)
    : pending
      ? createKey(pending)
      : shown
        ? 'unlinked'
        : null
  // A draft or bare payee needs a closed-field representation, not a search result.
  const items =
    chosen || !value
      ? options
      : [
          ...options,
          {
            value,
            label: shown,
            start: (
              <Favicon
                domain={
                  unlinked
                    ? core.merchants.findWebsiteDomain(payee, originalPayee)
                    : undefined
                }
                fallback={glyph()}
              />
            ),
          },
        ]

  return (
    <Select
      {...restProps}
      label={placeholder}
      placeholder={placeholder}
      clearLabel={t('clearMerchant')}
      emptyIcon={debt ? <PersonIcon size={20} /> : <PlaceIcon size={20} />}
      value={value}
      items={items}
      renderValue={() =>
        shown ? (
          <span className={unlinked ? 'italic' : undefined}>{shown}</span>
        ) : null
      }
      onChange={next => {
        if (next === null) onChange(null)
        else if (next.startsWith('create:'))
          onChange({ title: next.slice('create:'.length) })
        else if (next.startsWith('merchant:')) {
          const selected = merchants[next.slice('merchant:'.length)]
          if (selected) onChange({ id: selected.id, title: selected.title })
        }
      }}
      emptyText={t('noMerchants')}
      search={{
        label: t('findMerchant'),
        placeholder: t('findMerchant'),
        initialQuery: initialMerchantSearch(Boolean(merchant), payee),
        autoHighlight: true,
        showMoreLabel: t('showAllMerchants'),
        filter: (_items, search, { expanded }) => {
          const query = normalizePayee(search)
          if (query) {
            const matches = all
              .map(option => ({
                option,
                priority: merchantMatchPriority(
                  normalizePayee(option.title),
                  usage[option.id],
                  query
                ),
              }))
              .filter(match => Number.isFinite(match.priority))
              .sort(
                (a, b) =>
                  a.priority - b.priority ||
                  a.option.title.localeCompare(b.option.title)
              )
              .map(match => toOption(match.option))
            if (!all.some(option => normalizePayee(option.title) === query)) {
              matches.push({
                value: createKey(search.trim()),
                label: t('createMerchant', { title: search.trim() }),
                start: <AddIcon size={20} />,
              })
            }
            return { items: matches }
          }
          const fits = all.filter(option =>
            debt ? usage[option.id]?.debt : usage[option.id]?.regular
          )
          const narrowed =
            !expanded && fits.length > 0 && fits.length < all.length
          return {
            items: (narrowed ? fits : all).map(toOption),
            hasMore: narrowed,
          }
        },
      }}
    />
  )
}

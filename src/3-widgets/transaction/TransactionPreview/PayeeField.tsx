import type { FC, ReactNode } from 'react'
import { useMemo } from 'react'
import { Autocomplete } from '@base-ui/react/autocomplete'
import { useTranslation } from 'react-i18next'
import type { TMerchantId } from '@/6-shared/types'
import {
  type FilledFieldState,
  FilledField,
  filledControlClass,
  FilledInput,
} from '@/6-shared/ui/FilledField'
import { ListRowBacking, listRowClass } from '@/6-shared/ui/ListRow'
import {
  overlaySurfaceClass,
  popupPositioning,
} from '@/6-shared/ui/overlaySurface'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { useScrollFade } from '@/6-shared/ui/useScrollFade'
import { core } from '@/zerro-core/redux'

type TMerchantOption = { value: TMerchantId; label: string }

export type PayeeFieldProps = FilledFieldState & {
  payee: string | null
  /** The normalised merchant, when the transaction carries one. */
  merchant: TMerchantId | null
  onChange: (payee: string, merchant: TMerchantId | null) => void
  icon: ReactNode
  placeholder: string
  className?: string
}

/** Where the money went, with the merchants ZenMoney already knows offered
 * as you type.
 *
 * The merchant is not a second thing to choose: it is derived from the text.
 * A payee that spells a known merchant exactly is that merchant, whether it
 * was picked off the list or typed out — which is also what makes picking one
 * and then editing the name drop the link, rather than leaving a transaction
 * claiming a merchant whose name it no longer carries. */
export const PayeeField: FC<PayeeFieldProps> = ({
  payee,
  merchant,
  onChange,
  icon,
  placeholder,
  className,
  ...state
}) => {
  const { t } = useTranslation('transaction')
  const merchants = core.merchants.useAll()
  const fadeRef = useScrollFade<HTMLDivElement>()

  // What the transaction list shows for this transaction, so the editor is
  // not the one place where a merchant-only transaction looks blank. The raw
  // payee is what ZenMoney's plugin read off the statement; the merchant is
  // what it was recognised as, and that is the name a person put there.
  const shown = (merchant ? merchants[merchant]?.title : payee) ?? ''

  const options = useMemo(
    () =>
      Object.values(merchants)
        .map(merchant => ({ value: merchant.id, label: merchant.title }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [merchants]
  )
  const byTitle = useMemo(() => {
    const map = new Map<string, TMerchantId>()
    options.forEach(option => {
      const key = option.label.trim().toLowerCase()
      if (!map.has(key)) map.set(key, option.value)
    })
    return map
  }, [options])

  // Nothing to complete: the autocomplete's popup would only ever say so.
  if (!options.length) {
    return (
      <FilledInput
        {...state}
        icon={icon}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        value={shown}
        onChange={event => onChange(event.target.value, null)}
        className={className}
      />
    )
  }

  return (
    <Autocomplete.Root
      items={options}
      value={shown}
      onValueChange={next =>
        onChange(next, byTitle.get(next.trim().toLowerCase()) ?? null)
      }
    >
      <FilledField {...state} icon={icon} className={className}>
        <Autocomplete.Input
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          className={filledControlClass}
        />
      </FilledField>

      <Autocomplete.Portal>
        <Autocomplete.Positioner
          {...popupPositioning}
          side="bottom"
          align="start"
          sideOffset={4}
          style={{ minWidth: 'var(--anchor-width)' }}
        >
          <Autocomplete.Popup
            ref={fadeRef}
            className={cn(overlaySurfaceClass, 'max-h-64')}
          >
            <Autocomplete.Empty className="px-4 py-2 text-body-sm text-muted-foreground">
              {t('noMerchants')}
            </Autocomplete.Empty>
            <Autocomplete.List>
              {(option: TMerchantOption) => (
                <Autocomplete.Item
                  key={option.value}
                  value={option}
                  className={listRowClass}
                >
                  <ListRowBacking />
                  {option.label}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}

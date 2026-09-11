import type { FC } from 'react'
import { Field } from '@base-ui/react/field'
import { Combobox } from '@base-ui/react/combobox'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TMerchantId } from '@/6-shared/types'
import { usePopup } from '@/6-shared/overlays'
import { AddIcon, PersonIcon, PlaceIcon } from '@/6-shared/ui/Icons'
import type { FilledFieldState } from '@/6-shared/ui/FilledField'
import {
  FilledButton,
  filledFieldClass,
  filledControlClass,
} from '@/6-shared/ui/FilledField'
import {
  ListRowBacking,
  ListRowIcon,
  listRowClass,
  ListRowText,
} from '@/6-shared/ui/ListRow'
import {
  surfacePadding,
  popupPositioning,
  anchoredSurfaceClass,
  overAnchor,
} from '@/6-shared/ui/overlaySurface'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { useScrollFade } from '@/6-shared/ui/useScrollFade'
import { core } from '@/zerro-core/redux'
import type { TDraftMerchant, TNamedMerchant } from './draft'
import { MerchantFavicon } from './MerchantFavicon'
import { initialMerchantSearch, merchantMatchPriority } from './merchantSearch'

type TMerchantOption = { id: TMerchantId; title: string }

/** What a row does when it is chosen. */
type TRow =
  | { kind: 'merchant'; merchant: TMerchantOption }
  | { kind: 'create'; title: string }
  | { kind: 'clear' }

export type MerchantFieldProps = FilledFieldState & {
  merchant: TDraftMerchant
  /** The free text an old transaction may carry instead of a merchant. */
  payee: string | null
  originalPayee: string | null
  /** Debts and everything else are with different people. */
  debt: boolean
  onChange: (named: TNamedMerchant | null) => void
  placeholder: string
  className?: string
}

const { normalizePayee } = core.merchants

/** Who the operation is with, chosen from the merchants ZenMoney knows.
 *
 * A picker rather than a text field: typing searches, and a name that matches
 * nothing offers to become a merchant instead of settling for a bare payee.
 * The list opens on the people the operation is likely to be with — the ones
 * debts have been with, the places money has been spent — and everything else
 * is one row away. */
export const MerchantField: FC<MerchantFieldProps> = ({
  merchant,
  payee,
  originalPayee,
  debt,
  onChange,
  placeholder,
  className,
  ...state
}) => {
  const { t } = useTranslation('transaction')
  const merchants = core.merchants.useAll()
  const usage = core.merchants.useUsage()
  const [open, setOpen] = usePopup()
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const fadeRef = useScrollFade<HTMLDivElement>()

  const all = useMemo(
    () =>
      Object.values(merchants)
        .map(option => ({ id: option.id, title: option.title }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [merchants]
  )

  const chosen = merchant && 'id' in merchant ? merchant.id : undefined
  const pending = merchant && 'title' in merchant ? merchant.title : undefined
  const shown = pending ?? (chosen && merchants[chosen]?.title) ?? payee ?? ''
  const unlinkedPayee = !merchant && !!payee
  const unlinkedDomain = useMemo(() => {
    if (merchant) return undefined
    return core.merchants.findWebsiteDomain(payee, originalPayee)
  }, [merchant, originalPayee, payee])

  // Searching looks through every merchant: the operation's kind decides what
  // the list opens on, not what it can reach.
  const query = normalizePayee(search)
  const found = query
    ? all
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
        .map(match => match.option)
    : null
  const fits = all.filter(option =>
    debt ? usage[option.id]?.debt : usage[option.id]?.regular
  )
  // The kind is a preference, not a wall: an operation whose kind has met
  // nobody yet opens on everyone rather than on an empty list.
  const narrowed = !showAll && fits.length > 0 && fits.length < all.length
  const listed = found ?? (narrowed ? fits : all)
  const creating =
    query && !all.some(option => normalizePayee(option.title) === query)
      ? search.trim()
      : null

  const rows: TRow[] = [
    ...(!query && shown ? [{ kind: 'clear' as const }] : []),
    ...listed.map(option => ({ kind: 'merchant' as const, merchant: option })),
    ...(creating ? [{ kind: 'create' as const, title: creating }] : []),
  ]

  // Matching merchants precede the create action so Base UI's automatic
  // highlight commits an existing match on Enter.
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (open) {
      setSearch(initialMerchantSearch(Boolean(merchant), payee))
      setShowAll(false)
    }
  }

  const choose = (row: TRow) => {
    if (row.kind === 'clear') return onChange(null)
    if (row.kind === 'create') return onChange({ title: row.title })
    onChange({ id: row.merchant.id, title: row.merchant.title })
  }

  /** A merchant money has been spent with is a place; one only ever met over
   * a debt is a person. One that does not exist yet takes the glyph of the
   * operation naming it. */
  const glyph = (id?: TMerchantId) =>
    (id ? usage[id]?.regular : !debt) ? (
      <PlaceIcon size={20} />
    ) : (
      <PersonIcon size={20} />
    )

  const rowIcon = (row: TRow) => {
    if (row.kind === 'create') return <AddIcon size={20} />
    if (row.kind === 'merchant') {
      return (
        <MerchantFavicon
          domain={usage[row.merchant.id]?.website?.domain}
          fallback={glyph(row.merchant.id)}
        />
      )
    }
    return null
  }

  const rowLabel = (row: TRow) => {
    if (row.kind === 'merchant') return row.merchant.title
    if (row.kind === 'create') return t('createMerchant', { title: row.title })
    return t('clearMerchant')
  }

  return (
    <Field.Root
      invalid={state.invalid}
      disabled={state.disabled}
      className="contents"
    >
      <Combobox.Root<TRow>
        readOnly={state.readOnly}
        items={rows}
        filter={null}
        autoHighlight
        value={
          chosen
            ? { kind: 'merchant', merchant: { id: chosen, title: shown } }
            : null
        }
        isItemEqualToValue={(a, b) => rowKey(a) === rowKey(b)}
        itemToStringLabel={rowLabel}
        inputValue={search}
        onInputValueChange={(value, details) => {
          if (
            details.reason === 'input-change' ||
            details.reason === 'input-clear'
          )
            setSearch(value)
        }}
        open={open}
        onOpenChange={setOpen}
        onValueChange={row => {
          if (row) choose(row)
        }}
        modal
      >
        <Combobox.Trigger
          render={
            <FilledButton
              {...state}
              aria-label={placeholder}
              icon={
                <MerchantFavicon
                  domain={
                    chosen ? usage[chosen]?.website?.domain : unlinkedDomain
                  }
                  fallback={glyph(chosen)}
                />
              }
              className={className}
            >
              {shown ? (
                <span className={cn(unlinkedPayee && 'italic')}>{shown}</span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </FilledButton>
          }
        />
        <Combobox.Portal>
          <Combobox.Positioner
            {...popupPositioning}
            side="bottom"
            align="start"
            alignOffset={-surfacePadding}
            sideOffset={data => overAnchor(data) - surfacePadding}
            collisionAvoidance={{ side: 'shift', align: 'shift' }}
          >
            <Combobox.Popup
              aria-label={placeholder}
              className={cn(
                anchoredSurfaceClass,
                'min-w-[calc(var(--anchor-width)+8px)] p-1'
              )}
            >
              <div className="flex max-h-[60vh] flex-col">
                <div
                  data-slot="filled-field"
                  className={cn(filledFieldClass, 'mb-1 shrink-0')}
                >
                  <Combobox.Input
                    ref={searchRef}
                    placeholder={t('findMerchant')}
                    aria-label={t('findMerchant')}
                    className={filledControlClass}
                  />
                </div>
                <Combobox.List
                  ref={fadeRef}
                  className="scroll-fade hidden-scroll -mx-1 my-0 block min-h-0 list-none overflow-x-hidden overflow-y-auto px-1 py-0 outline-none"
                >
                  {(row: TRow) => {
                    const selected =
                      row.kind === 'merchant' && row.merchant.id === chosen
                    const icon = rowIcon(row)
                    return (
                      <Combobox.Item
                        key={rowKey(row)}
                        value={row}
                        className={listRowClass}
                      >
                        <ListRowBacking selected={selected} />
                        {icon && <ListRowIcon>{icon}</ListRowIcon>}
                        <ListRowText className="truncate">
                          {rowLabel(row)}
                        </ListRowText>
                      </Combobox.Item>
                    )
                  }}
                </Combobox.List>
                <Combobox.Empty className="m-0 px-3 py-2 text-body-sm text-muted-foreground">
                  {t('noMerchants')}
                </Combobox.Empty>
                {!found && narrowed && (
                  <button
                    type="button"
                    className={listRowClass}
                    onClick={() => {
                      setShowAll(true)
                      searchRef.current?.focus()
                    }}
                  >
                    {t('showAllMerchants')}
                  </button>
                )}
              </div>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </Field.Root>
  )
}

function rowKey(row: TRow): string {
  return row.kind === 'merchant' ? row.merchant.id : row.kind
}

import type { FC, KeyboardEventHandler } from 'react'
import { useCallback, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TMerchantId } from '@/6-shared/types'
import { usePopup } from '@/6-shared/overlays'
import { AddIcon, PersonIcon, PlaceIcon } from '@/6-shared/ui/Icons'
import type { FilledFieldState } from '@/6-shared/ui/FilledField'
import { FilledButton, FilledInput } from '@/6-shared/ui/FilledField'
import {
  ListRowBacking,
  listRowClass,
  ListRowText,
} from '@/6-shared/ui/ListRow'
import { Popover } from '@/6-shared/ui/Popover'
import { surfacePadding } from '@/6-shared/ui/overlaySurface'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { useScrollFade } from '@/6-shared/ui/useScrollFade'
import { core } from '@/zerro-core/redux'
import type { TDraftMerchant, TNamedMerchant } from './draft'

type TMerchantOption = { id: TMerchantId; title: string }

/** What a row does when it is chosen. */
type TRow =
  | { kind: 'merchant'; merchant: TMerchantOption }
  | { kind: 'create'; title: string }
  | { kind: 'clear' }
  | { kind: 'showAll' }

export type MerchantFieldProps = FilledFieldState & {
  merchant: TDraftMerchant
  /** The free text an old transaction may carry instead of a merchant. */
  payee: string | null
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
  const [anchor, setAnchor] = useState<Element | null>(null)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  // `null` leaves the highlight on whichever row is the sensible default.
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const fadeRef = useScrollFade<HTMLUListElement>()
  const listId = useId()

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

  // Searching looks through every merchant: the operation's kind decides what
  // the list opens on, not what it can reach.
  const query = normalizePayee(search)
  const found = query
    ? all.filter(option => normalizePayee(option.title).includes(query))
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
    ...(creating ? [{ kind: 'create' as const, title: creating }] : []),
    ...(!query && shown ? [{ kind: 'clear' as const }] : []),
    ...listed.map(option => ({ kind: 'merchant' as const, merchant: option })),
    ...(!found && narrowed ? [{ kind: 'showAll' as const }] : []),
  ]

  // Enter takes the match rather than the offer to create: a typed prefix is
  // far more often the start of a name that exists than a new one.
  const focused = highlighted ?? (creating && listed.length ? 1 : 0)

  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (open) {
      setSearch('')
      setShowAll(false)
      setHighlighted(null)
    }
  }

  const choose = (row: TRow) => {
    if (row.kind === 'showAll') return setShowAll(true)
    setOpen(false)
    if (row.kind === 'clear') return onChange(null)
    if (row.kind === 'create') return onChange({ title: row.title })
    onChange({ id: row.merchant.id, title: row.merchant.title })
  }

  const onKeyDown: KeyboardEventHandler = event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted(Math.min(focused + 1, rows.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted(Math.max(focused - 1, 0))
    }
    if (event.key === 'Enter' && rows[focused]) {
      event.preventDefault()
      choose(rows[focused])
    }
  }

  // The ref is stable, so it runs when the highlighted row changes and not on
  // every render.
  const keepInView = useCallback(
    (node: HTMLButtonElement | null) =>
      node?.scrollIntoView({ block: 'nearest' }),
    []
  )

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
    if (row.kind === 'merchant') return glyph(row.merchant.id)
    return null
  }

  const rowLabel = (row: TRow) => {
    if (row.kind === 'merchant') return row.merchant.title
    if (row.kind === 'create') return t('createMerchant', { title: row.title })
    if (row.kind === 'clear') return t('clearMerchant')
    return t('showAllMerchants')
  }

  return (
    <>
      <FilledButton
        {...state}
        aria-label={placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        icon={glyph(chosen)}
        className={className}
        onClick={event => {
          setAnchor(event.currentTarget)
          setOpen(true)
        }}
      >
        {shown || <span className="text-muted-foreground">{placeholder}</span>}
      </FilledButton>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={anchor}
        placement="over"
        align="start"
        alignOffset={-surfacePadding}
        sideOffset={-surfacePadding}
        aria-label={placeholder}
        className="min-w-[calc(var(--anchor-width)+8px)] p-1"
      >
        {/* The search keeps its place and the rows scroll under it, so the
            list is the scroller and this box is what bounds it. The surface
            itself must stay a plain block: its scroll fade is drawn by
            pseudo-elements, and a flex surface would lay those out as items
            and push the content past both its edges. */}
        <div className="flex max-h-[60vh] flex-col">
          <FilledInput
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={
              rows[focused] ? `${listId}-${focused}` : undefined
            }
            value={search}
            onChange={event => {
              setSearch(event.target.value)
              setHighlighted(null)
            }}
            onKeyDown={onKeyDown}
            placeholder={t('findMerchant')}
            aria-label={t('findMerchant')}
            autoComplete="off"
            className="mb-1"
          />

          {rows.length ? (
            <ul
              ref={fadeRef}
              id={listId}
              role="listbox"
              // A plain block, not a flex column: the fade is drawn by
              // pseudo-elements, and flex would lay them out as items that
              // collapse and drag the rows up by their negative margin. The
              // side padding is given back so the fade reaches both edges.
              className="scroll-fade hidden-scroll -mx-1 my-0 block min-h-0 list-none overflow-x-hidden overflow-y-auto px-1 py-0"
            >
              {rows.map((row, index) => {
                const selected =
                  row.kind === 'merchant' && row.merchant.id === chosen
                return (
                  <li key={rowKey(row)} role="presentation">
                    <button
                      type="button"
                      role="option"
                      id={`${listId}-${index}`}
                      ref={index === focused ? keepInView : undefined}
                      tabIndex={-1}
                      aria-selected={selected}
                      data-highlighted={index === focused || undefined}
                      className={cn(listRowClass, 'gap-2')}
                      onClick={() => choose(row)}
                    >
                      <ListRowBacking selected={selected} />
                      <span className="inline-flex shrink-0 text-icon-foreground">
                        {rowIcon(row)}
                      </span>
                      <ListRowText className="truncate">
                        {rowLabel(row)}
                      </ListRowText>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="m-0 px-3 py-2 text-body-sm text-muted-foreground">
              {t('noMerchants')}
            </p>
          )}
        </div>
      </Popover>
    </>
  )
}

function rowKey(row: TRow): string {
  return row.kind === 'merchant' ? row.merchant.id : row.kind
}

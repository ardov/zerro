import type { FC, ReactNode, Ref } from 'react'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ListRowSubheader } from '@/6-shared/ui/ListRow'
import { ScrollArea } from '@/6-shared/ui/kit/ScrollArea'
import { ButtonBase } from '@/6-shared/ui/kit/ButtonBase'
import { formatDate, toISODate } from '@/6-shared/helpers/date'
import type { TDateDraft, TISODate, TTransactionId } from '@/6-shared/types'
import { DialogSurface } from '@/6-shared/ui/kit/Dialog'
import { useAsk, useAsked } from '@/6-shared/overlays'
import { Calendar } from '@/6-shared/ui/kit/Calendar'
import { useTranslation } from 'react-i18next'
import './GroupedList.css'
import '@/6-shared/ui/kit/HeaderSurface.css'

type GroupNode = { date: TISODate; ids: TTransactionId[] }
type Row = { date: TISODate; key: string } & (
  { kind: 'date' } | { kind: 'transaction'; id: TTransactionId }
)
const DATE_ROW_HEIGHT = 48
const TRANSACTION_HEIGHT = 72
// Switch 8px before the incoming date reaches the filter edge.
const DATE_SWITCH_OFFSET = 8

type GroupedListProps = {
  groups: GroupNode[]
  renderTransaction: (id: TTransactionId) => ReactNode
  initialDate?: TDateDraft
  restoredTopDate?: TISODate | null
  onTopDateChange?: (date: TISODate) => void
  header?: ReactNode
  emptyState?: ReactNode
}

export const GroupedList: FC<GroupedListProps> = ({
  groups,
  renderTransaction,
  initialDate,
  restoredTopDate,
  onTopDateChange,
  header,
  emptyState,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [measuredFilterHeight, setFilterHeight] = useState<number | null>(null)
  const headerHeight = measuredFilterHeight ?? 0
  const chipButtonRef = useRef<HTMLButtonElement>(null)
  const { t } = useTranslation()
  const ask = useAsk()
  const { rows, dateIndexes } = useMemo(() => {
    const rows: Row[] = []
    const dateIndexes: number[] = []
    for (const group of groups) {
      dateIndexes.push(rows.length)
      rows.push({ kind: 'date', date: group.date, key: `date:${group.date}` })
      for (const id of group.ids)
        rows.push({
          kind: 'transaction',
          date: group.date,
          id,
          key: `transaction:${id}`,
        })
    }
    return { rows, dateIndexes }
  }, [groups])

  useLayoutEffect(() => {
    const filterSurface = headerRef.current
    if (!filterSurface) return
    const observer = new ResizeObserver(([entry]) =>
      setFilterHeight(
        entry.borderBoxSize[0]?.blockSize ?? filterSurface.offsetHeight
      )
    )
    setFilterHeight(filterSurface.offsetHeight)
    observer.observe(filterSurface)
    return () => observer.disconnect()
  }, [])

  // eslint-disable-next-line react-hooks/incompatible-library -- Reads the mutable virtualizer on every render; React Compiler is not enabled.
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewportRef.current,
    getItemKey: useCallback((index: number) => rows[index].key, [rows]),
    estimateSize: index =>
      rows[index].kind === 'date' ? DATE_ROW_HEIGHT : TRANSACTION_HEIGHT,
    paddingStart: headerHeight,
    scrollPaddingStart: headerHeight,
    overscan: 6,
  })
  const scrollToDate = useCallback(
    (date: TDateDraft) => {
      if (!groups.length) return
      const iso = toISODate(date)
      const found = groups.findIndex(group => group.date <= iso)
      virtualizer.scrollToIndex(
        dateIndexes[found < 0 ? groups.length - 1 : found],
        { align: 'start' }
      )
    },
    [groups, dateIndexes, virtualizer]
  )

  const positioned = useRef(false)
  const previousInitialDate = useRef(initialDate)
  const items = virtualizer.getVirtualItems()
  const offset = virtualizer.scrollOffset ?? 0
  const boundary = offset + headerHeight + DATE_SWITCH_OFFSET
  const topItem = items.find(
    item => item.start <= boundary && item.end > boundary
  )
  const topDate = topItem
    ? rows[topItem.index].date
    : boundary >= virtualizer.getTotalSize()
      ? rows.at(-1)?.date
      : rows[0]?.date
  const pinned = offset > 0 && Boolean(topDate)
  const reportedDate = useRef<TISODate | null>(null)
  useLayoutEffect(() => {
    // Empty results collapse the native scroll offset. When rows return,
    // restore from the current props, not a target captured before filtering.
    if (!rows.length) {
      positioned.current = false
      return
    }
    if (measuredFilterHeight === null) return
    if (!positioned.current || initialDate !== previousInitialDate.current) {
      const target = positioned.current
        ? initialDate
        : (initialDate ?? restoredTopDate)
      positioned.current = true
      previousInitialDate.current = initialDate
      if (target) {
        scrollToDate(target)
        // Do not publish the pre-restoration date and overwrite the saved one.
        // The virtualizer reports the actual date on the following scroll render.
        if (viewportRef.current?.scrollTop !== offset) return
      }
    }
    if (topDate && topDate !== reportedDate.current) {
      reportedDate.current = topDate
      onTopDateChange?.(topDate)
    }
  }, [
    rows.length,
    measuredFilterHeight,
    initialDate,
    restoredTopDate,
    scrollToDate,
    offset,
    topDate,
    onTopDateChange,
  ])

  useLayoutEffect(() => {
    const active = document.activeElement
    if (pinned && active?.closest('.transaction-date-heading[data-pinned]')) {
      if (viewportRef.current?.contains(active))
        chipButtonRef.current?.focus({ preventScroll: true })
    } else if (!pinned && active === chipButtonRef.current) {
      viewportRef.current
        ?.querySelector<HTMLButtonElement>('.transaction-date-heading button')
        ?.focus({ preventScroll: true })
    }
  }, [pinned, topDate])

  const onDateClick = async (date: TISODate) => {
    const picked = await ask<TISODate>(
      <DateDialog
        value={date}
        minDate={groups.at(-1)?.date}
        maxDate={groups[0]?.date}
      />
    )
    if (picked) scrollToDate(picked)
  }

  return (
    <div className="relative h-full min-h-0">
      <div
        ref={headerRef}
        className="transaction-filter-surface kit-header-surface absolute inset-x-0 top-0 z-20"
      >
        {header}
      </div>
      <div
        className="transaction-date-surface pointer-events-none absolute inset-x-0 z-10"
        style={{ top: headerHeight, height: DATE_ROW_HEIGHT }}
      >
        <div className="transaction-list-width flex h-full items-center px-6">
          {topDate && (
            <PinnedDateChip
              date={topDate}
              pinned={pinned}
              ref={chipButtonRef}
              onClick={() => onDateClick(topDate)}
            />
          )}
        </div>
      </div>
      <ScrollArea
        className="h-full"
        viewportRef={viewportRef}
        insetTop={`${headerHeight}px`}
      >
        <div
          role="list"
          aria-label={t('transactions')}
          style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
        >
          {items.map(item => {
            const row = rows[item.index]
            const hiddenDate =
              row.kind === 'date' && pinned && row.date === topDate
            return (
              <div
                key={item.key}
                role="listitem"
                data-row-key={row.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <div className="transaction-list-width px-2">
                  {row.kind === 'date' ? (
                    <ListRowSubheader
                      className="transaction-date-heading tabular-nums"
                      data-pinned={hiddenDate || undefined}
                      aria-hidden={hiddenDate || undefined}
                    >
                      <ButtonBase
                        className="align-baseline"
                        tabIndex={hiddenDate ? -1 : 0}
                        onClick={() => onDateClick(row.date)}
                      >
                        {formatDate(row.date)}
                      </ButtonBase>
                    </ListRowSubheader>
                  ) : (
                    renderTransaction(row.id)
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {!rows.length && <div>{emptyState}</div>}
      </ScrollArea>
    </div>
  )
}

function PinnedDateChip({
  date,
  pinned,
  ref,
  onClick,
}: {
  date: TISODate
  pinned: boolean
  ref: Ref<HTMLButtonElement>
  onClick: () => void
}) {
  return (
    <ButtonBase
      ref={ref}
      className="transaction-date-chip pointer-events-auto -ml-2 h-6 rounded-2xl rounded-smooth px-2 text-ui-14 font-medium tracking-normal text-ui-secondary tabular-nums"
      data-pinned={pinned || undefined}
      aria-hidden={!pinned}
      tabIndex={pinned ? 0 : -1}
      onClick={onClick}
      aria-label={formatDate(date)}
    >
      <DateLabel date={date} />
    </ButtonBase>
  )
}

/** Two bounded layers: rapid scrolling replaces the outgoing label rather than
 * accumulating an animation queue. The button's accessible name is always current. */
function DateLabel({ date }: { date: TISODate }) {
  const [labels, setLabels] = useState<{
    date: TISODate
    outgoing: TISODate | null
  }>({ date, outgoing: null })
  if (labels.date !== date) {
    setLabels({
      date,
      outgoing: labels.date,
    })
  }
  return (
    <span
      key={labels.date}
      className="transaction-date-label relative block overflow-hidden"
      data-direction={
        labels.outgoing && labels.date > labels.outgoing
          ? 'backward'
          : 'forward'
      }
      data-changing={labels.outgoing ? '' : undefined}
      aria-hidden="true"
    >
      <span className="transaction-date-outgoing absolute inset-0 opacity-0">
        {labels.outgoing && formatDate(labels.outgoing)}
      </span>
      <span className="transaction-date-current block">
        {formatDate(labels.date)}
      </span>
    </span>
  )
}

type TDateDialogProps = {
  value: TISODate
  minDate?: TISODate
  maxDate?: TISODate
}

/** «Which day?». It answers the date, so the caller scrolls there after the
 * `await` — no callback rides along, and nothing has to reach a stale close. */
const DateDialog = ({ value, minDate, maxDate }: TDateDialogProps) => {
  const { t } = useTranslation()
  const { controller, answer } = useAsked<TISODate>()
  return (
    <DialogSurface
      controller={controller}
      label={t('selectDate')}
      closeButton={false}
      mobile="drawer"
      className="w-max"
    >
      <div className="flex justify-center">
        <Calendar
          autoFocus
          value={value}
          minDate={minDate}
          maxDate={maxDate}
          onChange={date => answer(date)}
        />
      </div>
    </DialogSurface>
  )
}

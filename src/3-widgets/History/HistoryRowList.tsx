import { IconButton } from '@/6-shared/ui/Button'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Chip } from '@/6-shared/ui/Chip'
import {
  ListRowSubheader,
  ListRowText,
  ListRows,
  listItemDenseClass,
} from '@/6-shared/ui/ListRow'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { formatTimeAgo } from '@/6-shared/helpers/date'
import { commandVerbLabelKeys } from '@/6-shared/localization/commandVerbs'
import { ChevronDownIcon } from '@/6-shared/ui/Icons'
import type { TCommand } from '@/zerro-core/replica'
import { useAppDispatch } from '@/store'
import {
  historyRowPoint,
  sameHistoryPoint,
  toggleHistoryRun,
  type THistoryPointRef,
  type THistoryRow,
} from '@/store/history'
import { useChangeSummaryText } from './changeSummaryText'

/** Renders the ordered history list: local changes above, accepted server
 * points below, each half under its own heading. */
export function HistoryRowList({
  rows,
  selected,
  head,
  onSelect,
}: {
  rows: THistoryRow[]
  selected: THistoryPointRef | null
  /** The row that is the live state, marked so the list always says where
   * "now" is rather than leaving it to be inferred from the order. */
  head: THistoryPointRef | null
  onSelect: (point: THistoryPointRef) => void
}) {
  return (
    <ListRows disablePadding>
      {rows.map(row => (
        <HistoryRowItem
          key={rowKey(row)}
          row={row}
          selected={selected}
          head={head}
          onSelect={onSelect}
        />
      ))}
    </ListRows>
  )
}

function HistoryRowItem({
  row,
  selected,
  head,
  onSelect,
}: {
  row: THistoryRow
  selected: THistoryPointRef | null
  head: THistoryPointRef | null
  onSelect: (point: THistoryPointRef) => void
}) {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const summaryText = useChangeSummaryText()
  const point = historyRowPoint(row)
  const isSelected = !!point && !!selected && sameHistoryPoint(point, selected)
  const isHead = !!point && !!head && sameHistoryPoint(point, head)

  if (row.type === 'section') {
    // The local stack sits above the journal, and that order is not time: a
    // background pull lands under unsent commands that were made before it.
    return (
      // Not sticky, and re-typed to `overline` at a tighter leading. The
      // type is spelled in utilities rather than `text-overline` so that
      // tailwind-merge can see it beat the subheader's own `text-sm/[48px]`.
      <ListRowSubheader className="bg-transparent pt-1 text-xs/[2] font-normal uppercase">
        {t(row.id === 'local' ? 'sectionLocal' : 'sectionSynced')}
      </ListRowSubheader>
    )
  }

  if (row.type === 'redo') {
    return (
      <div className="px-4 py-1 opacity-50 text-body-sm">
        <ListRowText className="my-1 truncate" secondary={t('undoneHint')}>
          {commandTitle(row.command, t)}
        </ListRowText>
      </div>
    )
  }

  if (row.type === 'run') {
    const toggle = () => dispatch(toggleHistoryRun(row.id))
    return (
      // The chevron is a sibling of the row because a button cannot contain
      // another button.
      <div className="relative flex w-full min-w-0">
        <button
          type="button"
          className={cn(listItemDenseClass, 'pr-12')}
          data-selected={isSelected || undefined}
          onClick={() => (point ? onSelect(point) : toggle())}
        >
          <RowText
            primary={t('updatesCollapsed', { count: row.entries.length })}
            secondary={formatTimeAgo(row.entries[0].serverTimestamp)}
            isHead={isHead}
            nowLabel={t('nowBadge')}
          />
        </button>
        <IconButton
          size="small"
          className="absolute top-1/2 right-2 -translate-y-1/2"
          aria-label={row.expanded ? t('collapseRun') : t('expandRun')}
          onClick={toggle}
        >
          <ChevronDownIcon
            size={20}
            className={row.expanded ? 'rotate-180' : undefined}
          />
        </IconButton>
      </div>
    )
  }

  if (row.type === 'local') {
    return (
      <button
        type="button"
        className={listItemDenseClass}
        data-selected={isSelected || undefined}
        onClick={() => onSelect(row.point)}
      >
        {/* No change counts here: the command's own label already names the
            act, and "Goal changed · Goals 1" only repeats it in numbers. */}
        <RowText
          primary={commandTitle(row.command, t)}
          secondary={formatTimeAgo(row.command.issuedAt)}
          isHead={isHead}
          nowLabel={t('nowBadge')}
        />
      </button>
    )
  }

  // row.type === 'journal'
  const { entry } = row
  return (
    <button
      type="button"
      data-selected={isSelected || undefined}
      onClick={() => onSelect(row.point)}
      className={cn(listItemDenseClass, row.nested && 'pl-8')}
    >
      {/* Counts stay on server rows: a pull has no label of its own, so the
          only thing that distinguishes one update from another is what moved. */}
      <RowText
        primary={
          entry.kind === 'checkpoint' ? t('checkpoint') : t('serverSync')
        }
        secondary={secondaryLine(
          formatTimeAgo(entry.serverTimestamp),
          summaryText(entry.summary)
        )}
        isHead={isHead}
        nowLabel={t('nowBadge')}
      />
    </button>
  )
}

/** One row's text, plus the "now" marker when this row is the live state. */
function RowText({
  primary,
  secondary,
  isHead,
  nowLabel,
}: {
  primary: string
  secondary: string
  isHead: boolean
  nowLabel: string
}) {
  return (
    <ListRowText className="my-1 truncate" secondary={secondary}>
      {isHead ? (
        <span className="flex min-w-0 flex-row items-center gap-2">
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {primary}
          </span>
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={nowLabel}
            className="h-[18px] shrink-0 [&_[data-slot=chip-label]]:px-1.5"
          />
        </span>
      ) : (
        primary
      )}
    </ListRowText>
  )
}

/** Time first, then what moved. One line, so the row height never changes. */
function secondaryLine(time: string, summary: string): string {
  return summary ? `${time} · ${summary}` : time
}

/**
 * What the command says it did, or the generic word for one that says nothing.
 *
 * A label is optional by design — it is dropped when unreadable, and commands
 * issued before labels existed have none — so every row must still render
 * without one.
 */
function commandTitle(command: TCommand, t: TFunction<'history'>): string {
  const label = command.label
  if (!label) return t('unnamedChange')
  const verb = t(commandVerbLabelKeys[label.verb])
  return label.args?.name ? `${verb} · ${label.args.name}` : verb
}

function rowKey(row: THistoryRow): string {
  if (row.type === 'section') return `section:${row.id}`
  if (row.type === 'redo') return `redo:${row.command.issuedAt}`
  if (row.type === 'run') return `run:${row.id}`
  if (row.type === 'local') return `local:${row.point.index}`
  return `journal:${row.entry.sequence}`
}

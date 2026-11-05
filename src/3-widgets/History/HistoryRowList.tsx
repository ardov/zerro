import { TextFade } from '@/6-shared/ui/kit/TextFade'
import { IconButton } from '@/6-shared/ui/kit/Button'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Chip } from '@/6-shared/ui/kit/Chip'
import {
  ListRow,
  ListRowButton,
  ListRowHeader,
} from '@/6-shared/ui/kit/ListRow'
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
    <div className="relative flex flex-col">
      {rows.map(row => (
        <HistoryRowItem
          key={rowKey(row)}
          row={row}
          selected={selected}
          head={head}
          onSelect={onSelect}
        />
      ))}
    </div>
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
      <ListRowHeader
        size="sm"
        className="pt-1 text-xs/[2] font-normal uppercase"
      >
        {t(row.id === 'local' ? 'sectionLocal' : 'sectionSynced')}
      </ListRowHeader>
    )
  }

  if (row.type === 'redo') {
    return (
      <ListRow
        size="sm"
        className="opacity-ui-disabled"
        description={<TextFade>{t('undoneHint')}</TextFade>}
      >
        <TextFade>{commandTitle(row.command, t)}</TextFade>
      </ListRow>
    )
  }

  if (row.type === 'run') {
    const toggle = () => dispatch(toggleHistoryRun(row.id))
    return (
      // The chevron is a sibling of the row because a button cannot contain
      // another button.
      <div className="relative flex w-full min-w-0">
        <ListRowButton
          size="sm"
          className="pr-12"
          selected={isSelected}
          description={
            <TextFade>{formatTimeAgo(row.entries[0].serverTimestamp)}</TextFade>
          }
          onClick={() => (point ? onSelect(point) : toggle())}
        >
          <RowText
            primary={t('updatesCollapsed', { count: row.entries.length })}
            isHead={isHead}
            nowLabel={t('nowBadge')}
          />
        </ListRowButton>
        <IconButton
          variant="ghost"
          size="sm"
          className="absolute top-1/2 right-2 -translate-y-1/2"
          label={row.expanded ? t('collapseRun') : t('expandRun')}
          aria-expanded={row.expanded}
          onClick={toggle}
        >
          <ChevronDownIcon
            className={row.expanded ? 'rotate-180' : undefined}
          />
        </IconButton>
      </div>
    )
  }

  if (row.type === 'local') {
    return (
      <ListRowButton
        size="sm"
        selected={isSelected}
        description={<TextFade>{formatTimeAgo(row.command.issuedAt)}</TextFade>}
        onClick={() => onSelect(row.point)}
      >
        {/* No change counts here: the command's own label already names the
            act, and "Goal changed · Goals 1" only repeats it in numbers. */}
        <RowText
          primary={commandTitle(row.command, t)}
          isHead={isHead}
          nowLabel={t('nowBadge')}
        />
      </ListRowButton>
    )
  }

  // row.type === 'journal'
  const { entry } = row
  return (
    <ListRowButton
      size="sm"
      selected={isSelected}
      onClick={() => onSelect(row.point)}
      indent={row.nested ? 1 : 0}
      description={
        <TextFade>
          {secondaryLine(
            formatTimeAgo(entry.serverTimestamp),
            summaryText(entry.summary)
          )}
        </TextFade>
      }
    >
      {/* Counts stay on server rows: a pull has no label of its own, so the
          only thing that distinguishes one update from another is what moved. */}
      <RowText
        primary={
          entry.kind === 'checkpoint' ? t('checkpoint') : t('serverSync')
        }
        isHead={isHead}
        nowLabel={t('nowBadge')}
      />
    </ListRowButton>
  )
}

/** One row's text, plus the "now" marker when this row is the live state. */
function RowText({
  primary,
  isHead,
  nowLabel,
}: {
  primary: string
  isHead: boolean
  nowLabel: string
}) {
  return isHead ? (
    <span className="flex min-w-0 flex-row items-center gap-2">
      <TextFade>{primary}</TextFade>
      <Chip size="sm" variant="outline">
        {nowLabel}
      </Chip>
    </span>
  ) : (
    <TextFade>{primary}</TextFade>
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

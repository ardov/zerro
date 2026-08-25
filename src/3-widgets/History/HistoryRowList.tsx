import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import {
  Chip,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from '@mui/material'
import { formatTimeAgo } from '6-shared/helpers/date'
import { commandVerbLabelKeys } from '6-shared/localization/commandVerbs'
import { ChevronDownIcon } from '6-shared/ui/Icons'
import type { TCommand } from 'zerro-core/replica'
import { useAppDispatch } from 'store'
import {
  historyRowPoint,
  sameHistoryPoint,
  toggleHistoryRun,
  type THistoryPointRef,
  type THistoryRow,
} from 'store/history'
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
    // `component="div"`: the list mixes button rows and plain headings, and
    // a `ul` may only hold list items.
    <List disablePadding dense component="div">
      {rows.map(row => (
        <HistoryRowItem
          key={rowKey(row)}
          row={row}
          selected={selected}
          head={head}
          onSelect={onSelect}
        />
      ))}
    </List>
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
      <ListSubheader
        disableSticky
        sx={{
          bgcolor: 'transparent',
          color: 'text.secondary',
          typography: 'overline',
          lineHeight: 2,
          pt: 1,
        }}
      >
        {t(row.id === 'local' ? 'sectionLocal' : 'sectionSynced')}
      </ListSubheader>
    )
  }

  if (row.type === 'redo') {
    return (
      <ListItemText
        className="px-4 py-1 opacity-50"
        primary={commandTitle(row.command, t)}
        secondary={t('undoneHint')}
        slotProps={{
          primary: { variant: 'body2', noWrap: true },
          secondary: { noWrap: true },
        }}
      />
    )
  }

  if (row.type === 'run') {
    const toggle = () => dispatch(toggleHistoryRun(row.id))
    return (
      <ListItemButton
        selected={isSelected}
        onClick={() => (point ? onSelect(point) : toggle())}
      >
        <RowText
          primary={t('updatesCollapsed', { count: row.entries.length })}
          secondary={formatTimeAgo(row.entries[0].serverTimestamp)}
          isHead={isHead}
          nowLabel={t('nowBadge')}
        />
        <IconButton
          size="small"
          aria-label={row.expanded ? t('collapseRun') : t('expandRun')}
          onClick={event => {
            event.stopPropagation()
            toggle()
          }}
        >
          <ChevronDownIcon
            fontSize="small"
            sx={{ transform: row.expanded ? 'rotate(180deg)' : undefined }}
          />
        </IconButton>
      </ListItemButton>
    )
  }

  if (row.type === 'local') {
    return (
      <ListItemButton selected={isSelected} onClick={() => onSelect(row.point)}>
        {/* No change counts here: the command's own label already names the
            act, and "Goal changed · Goals 1" only repeats it in numbers. */}
        <RowText
          primary={commandTitle(row.command, t)}
          secondary={formatTimeAgo(row.command.issuedAt)}
          isHead={isHead}
          nowLabel={t('nowBadge')}
        />
      </ListItemButton>
    )
  }

  // row.type === 'journal'
  const { entry } = row
  return (
    <ListItemButton
      selected={isSelected}
      onClick={() => onSelect(row.point)}
      className={row.nested ? 'pl-8' : undefined}
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
    </ListItemButton>
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
    <ListItemText
      primary={
        isHead ? (
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
              sx={{
                height: 18,
                flexShrink: 0,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          </span>
        ) : (
          primary
        )
      }
      secondary={secondary}
      slotProps={{
        primary: { noWrap: !isHead },
        secondary: { noWrap: true },
      }}
    />
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

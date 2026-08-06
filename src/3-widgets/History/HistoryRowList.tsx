import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import {
  Chip,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
} from '@mui/material'
import { formatDate } from '6-shared/helpers/date'
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

/** Renders the same ordered history list for both the sync-button preview
 * (which only ever receives redo/local rows) and the full panel. */
export function HistoryRowList({
  rows,
  selected,
  onSelect,
}: {
  rows: THistoryRow[]
  selected: THistoryPointRef | null
  onSelect: (point: THistoryPointRef) => void
}) {
  return (
    // `component="div"`: the list mixes button rows and a plain divider, and
    // a `ul` may only hold list items.
    <List disablePadding dense component="div">
      {rows.map(row => (
        <HistoryRowItem
          key={rowKey(row)}
          row={row}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </List>
  )
}

function HistoryRowItem({
  row,
  selected,
  onSelect,
}: {
  row: THistoryRow
  selected: THistoryPointRef | null
  onSelect: (point: THistoryPointRef) => void
}) {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const summaryText = useChangeSummaryText()
  const point = historyRowPoint(row)
  const isSelected = !!point && !!selected && sameHistoryPoint(point, selected)

  if (row.type === 'divider') {
    // The local stack sits above the journal, and that order is not time: a
    // background pull lands under unsent commands that were made before it.
    return <Divider sx={{ my: 0.5 }} />
  }

  if (row.type === 'redo') {
    return (
      <ListItemText
        sx={{ px: 2, py: 0.5, opacity: 0.5 }}
        primary={commandTitle(row.command, t)}
        slotProps={{ primary: { variant: 'body2' } }}
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
        <ListItemText
          primary={t('updatesCollapsed', { count: row.entries.length })}
          secondary={formatDate(
            row.entries[0].serverTimestamp,
            'd MMM yyyy, HH:mm'
          )}
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
        <ListItemText
          primary={commandTitle(row.command, t)}
          secondary={secondaryLine(
            formatDate(row.command.issuedAt, 'd MMM yyyy, HH:mm'),
            summaryText(row.summary)
          )}
          slotProps={{
            primary: { noWrap: true },
            secondary: { noWrap: true },
          }}
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
      sx={row.nested ? { pl: 4 } : undefined}
    >
      <ListItemText
        primary={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <span>
              {entry.kind === 'checkpoint' ? t('checkpoint') : t('serverSync')}
            </span>
            {entry.validation.kind === 'invalid' && (
              <Chip
                size="small"
                color="error"
                label={t('validationInvalidShort')}
              />
            )}
          </Stack>
        }
        secondary={secondaryLine(
          formatDate(entry.serverTimestamp, 'd MMM yyyy, HH:mm'),
          summaryText(entry.summary)
        )}
        slotProps={{ secondary: { noWrap: true } }}
      />
    </ListItemButton>
  )
}

/** Date first, then what moved. One line, so the row height never changes. */
function secondaryLine(date: string, summary: string): string {
  return summary ? `${date} · ${summary}` : date
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
  if (row.type === 'divider') return 'divider'
  if (row.type === 'redo') return `redo:${row.command.issuedAt}`
  if (row.type === 'run') return `run:${row.id}`
  if (row.type === 'local') return `local:${row.point.index}`
  return `journal:${row.entry.branchId}:${row.entry.ref.pointId ?? 'checkpoint'}`
}

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
import { ChevronDownIcon } from '6-shared/ui/Icons'
import { useAppDispatch } from 'store'
import {
  historyRowPoint,
  sameHistoryPoint,
  toggleHistoryRun,
  type THistoryPointRef,
  type THistoryRow,
} from 'store/history'

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
        primary={t('unnamedChange')}
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
          primary={t('unnamedChange')}
          secondary={formatDate(row.command.issuedAt, 'd MMM yyyy, HH:mm')}
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
        secondary={formatDate(entry.serverTimestamp, 'd MMM yyyy, HH:mm')}
      />
    </ListItemButton>
  )
}

function rowKey(row: THistoryRow): string {
  if (row.type === 'divider') return 'divider'
  if (row.type === 'redo') return `redo:${row.command.issuedAt}`
  if (row.type === 'run') return `run:${row.id}`
  if (row.type === 'local') return `local:${row.point.index}`
  return `journal:${row.entry.branchId}:${row.entry.ref.pointId ?? 'checkpoint'}`
}

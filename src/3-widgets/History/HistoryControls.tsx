import { useTranslation } from 'react-i18next'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { RedoIcon, SendIcon, UndoIcon } from '6-shared/ui/Icons'
import { useAppDispatch, useAppSelector } from 'store'
import {
  getCanRedoClientCommand,
  getCanUndoClientCommand,
  getChangedNum,
  redoClientCommand,
  undoClientCommand,
} from 'store/data'
import { selectIsSyncPending } from 'store/sync'
import { syncData } from '4-features/sync'

/** Undo/redo and the pending-command count, shared by the sync-button preview
 * and the full panel: it is the same live outbox, just shown at two sizes. */
export function HistoryControls() {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const canUndo = useAppSelector(getCanUndoClientCommand)
  const canRedo = useAppSelector(getCanRedoClientCommand)
  const pending = useAppSelector(getChangedNum)
  const isSyncing = useAppSelector(selectIsSyncPending)

  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ alignItems: 'center', px: 1, py: 0.5 }}
    >
      <Tooltip title={t('undo')}>
        <span>
          <IconButton
            size="small"
            disabled={!canUndo}
            onClick={() => dispatch(undoClientCommand())}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('redo')}>
        <span>
          <IconButton
            size="small"
            disabled={!canRedo}
            onClick={() => dispatch(redoClientCommand())}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Typography
        variant="body2"
        color="text.secondary"
        noWrap
        sx={{ flexGrow: 1, minWidth: 0 }}
      >
        {t('pendingCount', { count: pending })}
      </Typography>
      <Tooltip title={t('sendChanges')}>
        <span>
          <IconButton
            size="small"
            color="primary"
            disabled={!pending || isSyncing}
            onClick={() => dispatch(syncData())}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  )
}

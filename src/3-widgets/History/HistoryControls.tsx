import { Button, IconButton } from '6-shared/ui/Button'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '6-shared/ui/Tooltip'
import { RedoIcon, SendIcon, UndoIcon } from '6-shared/ui/feather'
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

/**
 * Undo/redo and the push, above the list they act on.
 *
 * The pending count rides on the Send button rather than sitting beside it as
 * a sentence: it is the number of things that button is about to do, and the
 * "Unsent" section below already names the same commands one by one.
 */
export function HistoryControls() {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const canUndo = useAppSelector(getCanUndoClientCommand)
  const canRedo = useAppSelector(getCanRedoClientCommand)
  const pending = useAppSelector(getChangedNum)
  const isSyncing = useAppSelector(selectIsSyncPending)

  return (
    <div className="flex flex-row items-center gap-1 px-2 py-1">
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
      <div className="grow" />
      <Button
        size="small"
        variant="text"
        startIcon={<SendIcon fontSize="small" />}
        disabled={!pending || isSyncing}
        onClick={() => dispatch(syncData())}
        className="shrink-0 whitespace-nowrap"
      >
        {pending ? t('sendCount', { count: pending }) : t('sendChanges')}
      </Button>
    </div>
  )
}

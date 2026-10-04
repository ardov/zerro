import { Button, IconButton } from '@/6-shared/ui/kit/Button'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '@/6-shared/ui/kit/Tooltip'
import { RedoIcon, SendIcon, UndoIcon } from '@/6-shared/ui/Icons'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  getCanRedoClientCommand,
  getCanUndoClientCommand,
  getChangedNum,
  redoClientCommand,
  undoClientCommand,
} from '@/store/data'
import { selectIsSyncPending } from '@/store/sync'
import { syncData } from '@/4-features/sync'

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
      <Tooltip content={t('undo')}>
        <span>
          <IconButton
            variant="ghost"
            tooltip={false}
            label={t('undo')}
            size="sm"
            disabled={!canUndo}
            onClick={() => dispatch(undoClientCommand())}
          >
            <UndoIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip content={t('redo')}>
        <span>
          <IconButton
            variant="ghost"
            tooltip={false}
            label={t('redo')}
            size="sm"
            disabled={!canRedo}
            onClick={() => dispatch(redoClientCommand())}
          >
            <RedoIcon />
          </IconButton>
        </span>
      </Tooltip>
      <div className="grow" />
      <Button
        size="sm"
        variant="ghost"
        disabled={!pending || isSyncing}
        onClick={() => dispatch(syncData())}
        className="shrink-0 whitespace-nowrap"
      >
        <SendIcon data-icon="inline-start" />
        {pending ? t('sendCount', { count: pending }) : t('sendChanges')}
      </Button>
    </div>
  )
}

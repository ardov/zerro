import { useEffect } from 'react'

import { useAppDispatch, useAppSelector } from '@/store'
import {
  getCanRedoClientCommand,
  getCanUndoClientCommand,
  redoClientCommand,
  undoClientCommand,
} from '@/store/data'

type THistoryShortcut = 'undo' | 'redo'

type THistoryShortcutContext = {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

const editingTargetSelector = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
].join(', ')

export function getHistoryShortcut(
  event: Pick<
    KeyboardEvent,
    'altKey' | 'code' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'
  >
): THistoryShortcut | null {
  if (event.altKey || event.metaKey === event.ctrlKey) return null

  const key = event.key.toLowerCase()
  const isZ = key === 'z' || event.code === 'KeyZ'
  const isY = key === 'y' || event.code === 'KeyY'

  if (isZ) return event.shiftKey ? 'redo' : 'undo'
  if (event.ctrlKey && isY && !event.shiftKey) return 'redo'

  return null
}

export function isEditingTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(editingTargetSelector)
}

export function handleHistoryShortcut(
  event: KeyboardEvent,
  context: THistoryShortcutContext
): void {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    isEditingTarget(event.target)
  )
    return

  const shortcut = getHistoryShortcut(event)
  if (!shortcut || (shortcut === 'undo' ? !context.canUndo : !context.canRedo))
    return

  event.preventDefault()
  if (shortcut === 'undo') context.undo()
  else context.redo()
}

export function HistoryShortcuts() {
  const dispatch = useAppDispatch()
  const canUndo = useAppSelector(getCanUndoClientCommand)
  const canRedo = useAppSelector(getCanRedoClientCommand)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) =>
      handleHistoryShortcut(event, {
        canUndo,
        canRedo,
        undo: () => dispatch(undoClientCommand()),
        redo: () => dispatch(redoClientCommand()),
      })

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canRedo, canUndo, dispatch])

  return null
}

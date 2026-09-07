import { Button, IconButton } from '@/6-shared/ui/Button'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useBreakpointDown } from '@/6-shared/hooks/useBreakpointDown'
import { formatDate } from '@/6-shared/helpers/date'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  HistoryIcon,
} from '@/6-shared/ui/Icons'
import { isEditingTarget } from '@/4-features/historyShortcuts'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  exitHistoryBrowsing,
  returnToCurrent,
  selectHistoryPoint,
  selectHistoryStep,
  selectIsBrowsingHistory,
  selectSelectedHistoryEntryMissing,
  selectSelectedHistoryPoint,
  selectSelectedHistoryTime,
} from '@/store/history'
import { historyPanelScreen } from './HistoryPanel'
import { useRestoreSelectedPoint } from './useRestoreSelectedPoint'

/**
 * The transport for browsing history once the panel is closed.
 *
 * While the panel is open it keeps only the job the panel cannot do: saying
 * that the page below is not live. Stepping, opening the panel and restoring
 * all drop out, because the panel is the better version of each — its list is
 * the step arrows, and its footer is the restore button next to what restoring
 * would cost. What stays are the two exits, which exist nowhere else, and the
 * coloured rule that marks the page.
 *
 * The bar itself never comes and goes while browsing, only its contents:
 * it pushes the page down, so appearing when the panel closes would shift what
 * you are reading. For the same reason no control changes meaning — stepping
 * to the newest row disables the forward arrow instead of closing the bar
 * under the finger pressing it.
 */
export function HistoryTopBar() {
  const { t } = useTranslation('history')
  const dispatch = useAppDispatch()
  const isNarrow = useBreakpointDown('sm')
  const browsing = useAppSelector(selectIsBrowsingHistory)
  const point = useAppSelector(selectSelectedHistoryPoint)
  const missing = useAppSelector(selectSelectedHistoryEntryMissing)
  const time = useAppSelector(selectSelectedHistoryTime)
  const step = useAppSelector(selectHistoryStep)
  const { canRestore, restore } = useRestoreSelectedPoint()
  const [panelOpen, setPanelOpen] = historyPanelScreen.use()

  // Escape leaves history. With ✕ it is the only way out, and both sit still.
  useEffect(() => {
    if (!browsing) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        isEditingTarget(event.target)
      )
        return
      dispatch(exitHistoryBrowsing())
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [browsing, dispatch])

  if (!browsing) return null

  // A null selection is the head of the list: live data under another name.
  const atHead = point === null
  const compact = !!panelOpen

  const label = missing
    ? t('pointUnavailable')
    : time
      ? formatDate(time, 'd MMM yyyy, HH:mm')
      : t('currentState')

  return (
    <div
      className={`border-b-2 bg-card px-2 py-1 sm:px-4 ${atHead ? 'border-border' : 'border-warning'}`}
    >
      <div className="flex flex-row items-center gap-1">
        {!compact && (
          <>
            <IconButton
              size="small"
              disabled={!step.back}
              onClick={() =>
                step.back && void dispatch(selectHistoryPoint(step.back))
              }
              aria-label={t('stepBack')}
            >
              <ChevronLeftIcon size={20} />
            </IconButton>
            <IconButton
              size="small"
              disabled={!step.forward}
              onClick={() =>
                step.forward && void dispatch(selectHistoryPoint(step.forward))
              }
              aria-label={t('stepForward')}
            >
              <ChevronRightIcon size={20} />
            </IconButton>
          </>
        )}
        {/* Left-aligned while the panel is open: the panel overlays the right
            of the page, and controls pushed under it are controls that are
            gone. */}
        <span
          className={`${compact ? 'grow-0' : 'grow'} min-w-0 truncate text-caption`}
        >
          {atHead ? label : t('viewingPast', { time: label })}
        </span>
        {!compact && (
          <>
            <IconButton
              size="small"
              onClick={() => setPanelOpen(true)}
              aria-label={t('openPanel')}
            >
              <HistoryIcon size={20} />
            </IconButton>
            {/* The date is the only thing allowed to shrink: a label that wraps
                would make the bar two rows tall mid-step and shift the page. */}
            <Button
              size="small"
              className="shrink-0 whitespace-nowrap"
              disabled={!canRestore}
              onClick={restore}
            >
              {isNarrow ? t('restoreShort') : t('restorePoint')}
            </Button>
          </>
        )}
        <Button
          size="small"
          className="shrink-0 whitespace-nowrap"
          disabled={atHead}
          onClick={() => dispatch(returnToCurrent())}
        >
          {t('goToCurrent')}
        </Button>
        <IconButton
          size="small"
          onClick={() => dispatch(exitHistoryBrowsing())}
          aria-label={t('exitHistory')}
        >
          <CloseIcon size={20} />
        </IconButton>
      </div>
    </div>
  )
}

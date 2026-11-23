import { TextFade } from '@/6-shared/ui/kit/TextFade'
import { Button, IconButton } from '@/6-shared/ui/kit/Button'
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

/** Keep the bar mounted while browsing so closing the panel does not shift the page. */
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

  const atHead = point === null
  const compact = !!panelOpen

  const label = missing
    ? t('pointUnavailable')
    : time
      ? formatDate(time, 'd MMM yyyy, HH:mm')
      : t('currentState')

  return (
    <div
      className={`border-b-2 bg-ui-card px-2 py-1 sm:px-4 ${atHead ? 'border-ui-border' : 'border-ui-warning'}`}
    >
      <div className="flex flex-row items-center gap-1">
        {!compact && (
          <>
            <IconButton
              size="xs"
              variant="ghost"
              disabled={!step.back}
              onClick={() =>
                step.back && void dispatch(selectHistoryPoint(step.back))
              }
              label={t('stepBack')}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              size="xs"
              variant="ghost"
              disabled={!step.forward}
              onClick={() =>
                step.forward && void dispatch(selectHistoryPoint(step.forward))
              }
              label={t('stepForward')}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}
        <TextFade
          className={`${compact ? 'grow-0' : 'grow'} min-w-0 text-caption`}
        >
          {atHead ? label : t('viewingPast', { time: label })}
        </TextFade>
        {!compact && (
          <>
            <IconButton
              size="xs"
              variant="ghost"
              onClick={() => setPanelOpen(true)}
              label={t('openPanel')}
            >
              <HistoryIcon />
            </IconButton>
            {/* The date is the only thing allowed to shrink: a label that wraps
                would make the bar two rows tall mid-step and shift the page. */}
            <Button
              size="xs"
              variant="ghost"
              className="shrink-0 whitespace-nowrap"
              disabled={!canRestore}
              onClick={restore}
            >
              {isNarrow ? t('restoreShort') : t('restorePoint')}
            </Button>
          </>
        )}
        <Button
          size="xs"
          variant="ghost"
          className="shrink-0 whitespace-nowrap"
          disabled={atHead}
          onClick={() => dispatch(returnToCurrent())}
        >
          {t('goToCurrent')}
        </Button>
        <IconButton
          size="xs"
          variant="ghost"
          onClick={() => dispatch(exitHistoryBrowsing())}
          label={t('exitHistory')}
        >
          <CloseIcon />
        </IconButton>
      </div>
    </div>
  )
}

import { IconButton } from '@/6-shared/ui/Button'
import type { ComponentProps, FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircularProgress } from '@/6-shared/ui/CircularProgress'
import { RadialProgress } from '@/6-shared/ui/RadialProgress'
import {
  SyncIcon,
  SyncDisabledIcon,
  DoneIcon,
  WarningIcon,
} from '@/6-shared/ui/Icons'
import { Tooltip } from '@/6-shared/ui/Tooltip'
import { cn } from '@/6-shared/ui/shadcn/utils'

import { getChangedNum } from '@/store/data'
import {
  selectIsSyncPending,
  selectLastSyncResult,
  selectSyncProgress,
  syncDetailsOpened,
} from '@/store/sync'
import { useAppDispatch, useAppSelector } from '@/store'
import { syncData } from '@/4-features/sync'
import { useRegularSync } from '@/3-widgets/RegularSyncHandler'

type ButtonState = 'idle' | 'pending' | 'stopped' | 'success' | 'fail'
type RefreshButtonProps = {
  isMobile?: boolean
  className?: string
}

const RefreshButton: FC<RefreshButtonProps> = ({ isMobile, ...rest }) => {
  const { t } = useTranslation(['common', 'syncProgress'])
  const dispatch = useAppDispatch()
  // Sync only. History used to hang off a right-click here, which made the
  // feature undiscoverable and gave one button two unrelated meanings; it is
  // a named item in the settings menu now.
  const changedNum = useAppSelector(getChangedNum)
  const isPending = useAppSelector(selectIsSyncPending)
  const progress = useAppSelector(selectSyncProgress)
  const hasDetails = !!progress
  const handleClick = useCallback(() => {
    if (hasDetails) dispatch(syncDetailsOpened())
    else dispatch(syncData())
  }, [dispatch, hasDetails])
  const menuProps = { onClick: handleClick }
  const lastResult = useAppSelector(selectLastSyncResult)
  const finishedAt = lastResult?.finishedAt || 0
  const [regular] = useRegularSync()

  let buttonState: ButtonState = 'idle'
  if (isPending)
    buttonState = progress?.kind === 'stopped' ? 'stopped' : 'pending'

  const [notification, setNotification] = useState<ButtonState | null>(null)

  const [prevFinishedAt, setPrevFinishedAt] = useState(finishedAt)
  if (prevFinishedAt !== finishedAt) {
    setPrevFinishedAt(finishedAt)
    if (finishedAt)
      setNotification(lastResult?.isSuccessful ? 'success' : 'fail')
  }

  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => setNotification(null), 2500)
    return () => clearTimeout(timer)
  }, [notification])

  const state: ButtonState = isPending
    ? buttonState
    : notification || buttonState
  const progressValue = progressRatio(progress?.rows ?? [])

  const components = {
    idle: regular ? <SyncIcon /> : <SyncDisabledIcon />,
    pending: progress ? (
      <RadialProgress
        aria-hidden
        size={24}
        value={progressValue}
        active={progress.kind === 'pushing' && progress.phase === 'sending'}
      />
    ) : (
      <CircularProgress size={24} />
    ),
    stopped: <WarningIcon className="text-error" />,
    success: <DoneIcon className="text-success" />,
    fail: <WarningIcon className="text-error" />,
  }
  const actionLabel = hasDetails
    ? t('syncProgress:detailsTitle')
    : t('common:refresh')

  return isMobile ? (
    <button
      type="button"
      aria-label={actionLabel}
      className={cn(rest.className, 'text-caption')}
      {...menuProps}
    >
      <SyncBadge count={changedNum}>{components[state]}</SyncBadge>
      <span>{actionLabel}</span>
    </button>
  ) : (
    <Tooltip
      title={
        hasDetails ? t('syncProgress:detailsTitle') : t('common:refreshData')
      }
    >
      <SyncBadge count={changedNum}>
        <IconButton {...menuProps} className={rest.className}>
          {components[state]}
        </IconButton>
      </SyncBadge>
    </Tooltip>
  )
}

function progressRatio(
  rows: NonNullable<ReturnType<typeof selectSyncProgress>>['rows']
) {
  let confirmed = 0
  let total = 0
  rows.forEach(row => {
    confirmed += row.confirmed
    total += row.total
  })
  return total ? confirmed / total : 0
}

type SyncBadgeProps = ComponentProps<'span'> & { count: number }

/** The root spreads what it is handed: `Tooltip` renders its trigger through
 * this element, and a component that keeps its props to itself would swallow
 * the handlers, the id and the label and leave the tooltip inert. */
function SyncBadge({ count, children, className, ...props }: SyncBadgeProps) {
  return (
    <span {...props} className={cn('relative inline-flex', className)}>
      {children}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-info px-0.5 text-[0.625rem]/4 font-medium text-info-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  )
}

export default RefreshButton

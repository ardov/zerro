import { IconButton, type IconButtonProps } from '@/6-shared/ui/kit/Button'
import type { FC, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RadialProgress } from '@/6-shared/ui/kit/RadialProgress'
import { SyncIcon, SyncDisabledIcon, WarningIcon } from '@/6-shared/ui/Icons'

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
type RefreshButtonProps = Pick<
  IconButtonProps,
  'className' | 'shape' | 'tooltipSide'
>

const RefreshButton: FC<RefreshButtonProps> = props => {
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
        size={20}
        value={progressValue}
        active={progress.kind === 'pushing' && progress.phase === 'sending'}
      />
    ) : (
      <RadialProgress size={20} />
    ),
    stopped: <WarningIcon className="text-ui-error" />,
    success: <RadialProgress size={20} value={1} />,
    fail: <WarningIcon className="text-ui-error" />,
  }
  const label = hasDetails
    ? t('syncProgress:detailsTitle')
    : t('common:refreshData')

  return (
    <SyncBadge count={changedNum}>
      <IconButton
        onClick={handleClick}
        label={label}
        variant="ghost"
        size="sm"
        {...props}
      >
        {components[state]}
      </IconButton>
    </SyncBadge>
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

type SyncBadgeProps = { count: number; children: ReactNode }

function SyncBadge({ count, children }: SyncBadgeProps) {
  return (
    <span className="relative inline-flex">
      {children}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-ui-info-solid px-0.5 text-[0.625rem]/4 font-medium text-ui-on-info">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  )
}

export default RefreshButton

import { IconButton } from '6-shared/ui/Button'
import type { FC, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircularProgress } from '6-shared/ui/CircularProgress'
import {
  SyncIcon,
  SyncDisabledIcon,
  DoneIcon,
  WarningIcon,
} from '6-shared/ui/feather'
import { Tooltip } from '6-shared/ui/Tooltip'
import { cn } from '6-shared/ui/shadcn/utils'

import { getChangedNum } from 'store/data'
import { selectIsSyncPending, selectLastSyncResult } from 'store/sync'
import { useAppDispatch, useAppSelector } from 'store'
import { syncData } from '4-features/sync'
import { useRegularSync } from '3-widgets/RegularSyncHandler'

type ButtonState = 'idle' | 'pending' | 'success' | 'fail'
type RefreshButtonProps = {
  isMobile?: boolean
  className?: string
}

const RefreshButton: FC<RefreshButtonProps> = ({ isMobile, ...rest }) => {
  const { t } = useTranslation('common')
  const dispatch = useAppDispatch()
  // Sync only. History used to hang off a right-click here, which made the
  // feature undiscoverable and gave one button two unrelated meanings; it is
  // a named item in the settings menu now.
  const menuProps = {
    onClick: useCallback(() => dispatch(syncData()), [dispatch]),
  }
  const changedNum = useAppSelector(getChangedNum)
  const isPending = useAppSelector(selectIsSyncPending)
  const lastResult = useAppSelector(selectLastSyncResult)
  const finishedAt = lastResult?.finishedAt || 0
  const [regular] = useRegularSync()

  let buttonState: ButtonState = 'idle'
  if (isPending) buttonState = 'pending'

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

  const state: ButtonState = notification || buttonState

  const components = {
    idle: regular ? <SyncIcon /> : <SyncDisabledIcon />,
    pending: <CircularProgress size={24} />,
    success: <DoneIcon color="success" />,
    fail: <WarningIcon color="error" />,
  }

  return isMobile ? (
    <button
      type="button"
      aria-label={t('refresh')}
      className={cn(rest.className, 'type-caption')}
      {...menuProps}
    >
      <SyncBadge count={changedNum}>{components[state]}</SyncBadge>
      <span>{t('refresh')}</span>
    </button>
  ) : (
    <Tooltip title={t('refreshData')}>
      <SyncBadge count={changedNum}>
        <IconButton {...menuProps} className={rest.className}>
          {components[state]}
        </IconButton>
      </SyncBadge>
    </Tooltip>
  )
}

function SyncBadge(props: { count: number; children: ReactNode }) {
  return (
    <span className="relative inline-flex">
      {props.children}
      {props.count > 0 && (
        <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-info px-0.5 text-[0.625rem]/4 font-medium text-info-foreground">
          {props.count > 99 ? '99+' : props.count}
        </span>
      )}
    </span>
  )
}

export default RefreshButton

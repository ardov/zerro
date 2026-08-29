import { IconButton } from '6-shared/ui/Button'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SxProps } from '@mui/material'
import { BottomNavigationAction } from '@mui/material'
import { CircularProgress } from '6-shared/ui/CircularProgress'
import Badge from '@mui/material/Badge'
import {
  SyncIcon,
  SyncDisabledIcon,
  DoneIcon,
  WarningIcon,
} from '6-shared/ui/Icons'
import { Tooltip } from '6-shared/ui/Tooltip'

import { getChangedNum } from 'store/data'
import { selectIsSyncPending, selectLastSyncResult } from 'store/sync'
import { useAppDispatch, useAppSelector } from 'store'
import { syncData } from '4-features/sync'
import { useRegularSync } from '3-widgets/RegularSyncHandler'

type ButtonState = 'idle' | 'pending' | 'success' | 'fail'
type RefreshButtonProps = {
  isMobile?: boolean
  className?: string
  sx?: SxProps
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
    <BottomNavigationAction
      label={t('refresh')}
      value="refresh"
      icon={
        <Badge color="info" overlap="rectangular" badgeContent={changedNum}>
          {components[state]}
        </Badge>
      }
      {...menuProps}
      {...rest}
    />
  ) : (
    <Tooltip title={t('refreshData')}>
      <Badge color="info" overlap="circular" badgeContent={changedNum}>
        <IconButton {...menuProps} {...rest}>
          {components[state]}
        </IconButton>
      </Badge>
    </Tooltip>
  )
}

export default RefreshButton

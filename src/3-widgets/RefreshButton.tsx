import React, { FC, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomNavigationAction, SxProps } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import {
  SyncIcon,
  SyncDisabledIcon,
  DoneIcon,
  WarningIcon,
} from '6-shared/ui/Icons'
import { Tooltip } from '6-shared/ui/Tooltip'

import { getChangedNum } from 'store/data'
import { getPendingState } from 'store/isPending'
import { getLastSyncInfo } from 'store/lastSync'
import { useAppDispatch, useAppSelector } from 'store'
import { syncData } from '4-features/sync'
import { useRegularSync } from '3-widgets/RegularSyncHandler'

type ButtonState = 'idle' | 'pending' | 'success' | 'fail'

const RefreshButton: FC<{ isMobile?: boolean; sx?: SxProps }> = ({
  isMobile,
  ...rest
}) => {
  const { t } = useTranslation('common')
  const dispatch = useAppDispatch()
  const handleClick = useCallback(() => dispatch(syncData()), [dispatch])
  const changedNum = useAppSelector(getChangedNum)
  const isPending = useAppSelector(getPendingState)
  const { isSuccessful, finishedAt } = useAppSelector(getLastSyncInfo)
  const [regular] = useRegularSync()

  let buttonState: ButtonState = 'idle'
  if (isPending) buttonState = 'pending'

  const [notification, setNotification] = useState<ButtonState | null>(null)

  useEffect(() => {
    if (!finishedAt) return
    setNotification(isSuccessful ? 'success' : 'fail')
    let timer1 = setTimeout(() => setNotification(null), 2500)
    return () => clearTimeout(timer1)
  }, [isSuccessful, finishedAt])

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
      onClick={handleClick}
      {...rest}
    />
  ) : (
    <Tooltip title={t('refreshData')}>
      <Badge color="info" overlap="circular" badgeContent={changedNum}>
        <IconButton onClick={handleClick} {...rest}>
          {components[state]}
        </IconButton>
      </Badge>
    </Tooltip>
  )
}

export default RefreshButton

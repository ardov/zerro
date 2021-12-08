import React, { FC, useCallback, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { syncData } from 'logic/sync'
import { getChangedNum } from 'store/data/selectors'
import { getPendingState } from 'store/isPending'
import CircularProgress from '@mui/material/CircularProgress'
import { BottomNavigationAction } from '@mui/material'
import {
  SyncIcon,
  SyncDisabledIcon,
  DoneIcon,
  WarningIcon,
} from 'components/Icons'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import { Tooltip } from 'components/Tooltip'
import { getLastSyncInfo } from 'store/lastSync'
import { useRegularSync } from 'components/RegularSyncHandler'

type ButtonState = 'idle' | 'pending' | 'success' | 'fail'

const RefreshButton: FC<{ isMobile?: boolean; className?: string }> = ({
  isMobile,
  ...rest
}) => {
  const dispatch = useDispatch()
  const handleClick = useCallback(() => dispatch(syncData()), [dispatch])
  const changedNum = useSelector(getChangedNum)
  const isPending = useSelector(getPendingState)
  const { isSuccessful, finishedAt } = useSelector(getLastSyncInfo)
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
      label="Обновить"
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
    <Tooltip title="Обновить данные">
      <Badge color="info" overlap="circular" badgeContent={changedNum}>
        <IconButton onClick={handleClick} {...rest}>
          {components[state]}
        </IconButton>
      </Badge>
    </Tooltip>
  )
}

export default RefreshButton

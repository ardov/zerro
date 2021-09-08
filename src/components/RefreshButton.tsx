import React, { FC, useCallback, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { syncData } from 'logic/sync'
import { getChangedNum } from 'store/localData'
import { getPendingState } from 'store/isPending'
import CircularProgress from '@mui/material/CircularProgress'
import { BottomNavigationAction } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import DoneIcon from '@mui/icons-material/Done'
import WarningIcon from '@mui/icons-material/Warning'
import BackupIcon from '@mui/icons-material/Backup'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material'
import { withStyles } from '@mui/styles'
import { Tooltip } from 'components/Tooltip'
import { getLastSyncInfo } from 'store/lastSync'

type ButtonState = 'idle' | 'hasDataToSync' | 'pending' | 'success' | 'fail'
const StyledBadge = withStyles({ badge: { top: '50%', right: 4 } })(Badge)

const RefreshButton: FC<{ isMobile?: boolean; className?: string }> = ({
  isMobile,
  ...rest
}) => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const handleClick = useCallback(() => dispatch(syncData()), [dispatch])
  const changedNum = useSelector(getChangedNum)
  const isPending = useSelector(getPendingState)
  const { isSuccessful, finishedAt } = useSelector(getLastSyncInfo)

  let buttonState: ButtonState = 'idle'
  if (!!changedNum) buttonState = 'hasDataToSync'
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
    idle: <RefreshIcon />,
    hasDataToSync: <BackupIcon />,
    pending: <CircularProgress size={24} />,
    success: <DoneIcon htmlColor={theme.palette.success.main} />,
    fail: <WarningIcon color="error" />,
  }

  const colors = {
    idle: 'default',
    hasDataToSync: 'primary',
    pending: 'default',
    success: 'default',
    fail: 'default',
  }

  return isMobile ? (
    <BottomNavigationAction
      label="Обновить"
      value="refresh"
      icon={
        <StyledBadge badgeContent={changedNum}>{components[state]}</StyledBadge>
      }
      onClick={handleClick}
      {...rest}
    />
  ) : (
    <Tooltip title="Обновить данные">
      <StyledBadge badgeContent={changedNum}>
        <IconButton
          onClick={handleClick}
          color={colors[state] as 'default' | 'primary'}
          {...rest}
        >
          {components[state]}
        </IconButton>
      </StyledBadge>
    </Tooltip>
  )
}

export default RefreshButton

import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { syncData } from 'logic/sync'
import { getChangedNum } from 'store/localData'
// import { getLastSyncTime } from 'store/serverData'
import { getPendingState } from 'store/isPending'
import CircularProgress from '@material-ui/core/CircularProgress'
import RefreshIcon from '@material-ui/icons/Refresh'
import BackupIcon from '@material-ui/icons/Backup'
import Badge from '@material-ui/core/Badge'
import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'
import Tooltip from '@material-ui/core/Tooltip'

const StyledBadge = withStyles({ badge: { top: '50%', right: 4 } })(Badge)

export default function RefreshButton({ ...rest }) {
  const dispatch = useDispatch()
  const changedNum = useSelector(getChangedNum)
  // const lastSync = useSelector(getLastSyncTime)
  const isPending = useSelector(getPendingState)
  const handleClick = useCallback(() => dispatch(syncData()), [dispatch])

  return (
    <Tooltip title="Обновить данные">
      <StyledBadge badgeContent={changedNum}>
        <IconButton
          onClick={handleClick}
          color={changedNum ? 'primary' : 'default'}
          {...rest}
        >
          {isPending ? (
            <CircularProgress size={24} />
          ) : changedNum ? (
            <BackupIcon />
          ) : (
            <RefreshIcon />
          )}
        </IconButton>
      </StyledBadge>
    </Tooltip>
  )
}

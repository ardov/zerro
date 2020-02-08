import React from 'react'
import { connect } from 'react-redux'
import { syncData } from 'logic/sync'
import { getChangedNum } from 'store/localData'
import { getLastSyncTime } from 'store/serverData'
import { getPendingState } from 'store/isPending'
import CircularProgress from '@material-ui/core/CircularProgress'
import RefreshIcon from '@material-ui/icons/Refresh'
import BackupIcon from '@material-ui/icons/Backup'
import Badge from '@material-ui/core/Badge'
import { BottomNavigationAction } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

const StyledBadge = withStyles(theme => ({
  badge: {
    top: '50%',
    right: 4,
  },
}))(Badge)

const RefreshButton = ({
  syncData,
  changedNum,
  isPending,
  lastSync,
  ...rest
}) => {
  return (
    <BottomNavigationAction
      label="Обновить"
      value="refresh"
      icon={
        <StyledBadge badgeContent={changedNum}>
          {isPending ? (
            <CircularProgress size={24} />
          ) : changedNum ? (
            <BackupIcon />
          ) : (
            <RefreshIcon />
          )}
        </StyledBadge>
      }
      onClick={syncData}
      {...rest}
    />
  )
}

const mapStateToProps = state => ({
  changedNum: getChangedNum(state),
  lastSync: getLastSyncTime(state),
  isPending: getPendingState(state),
})

const mapDispatchToProps = dispatch => ({
  syncData: () => dispatch(syncData()),
})

export default connect(mapStateToProps, mapDispatchToProps)(RefreshButton)

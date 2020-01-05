import React from 'react'
import { connect } from 'react-redux'
import { syncData } from 'logic/sync'
import { getChangedNum } from 'store/localData/dataSelectors'
import { getLastSyncTime } from 'store/serverData'
import { getPendingState } from 'store/isPending'
import CircularProgress from '@material-ui/core/CircularProgress'
import RefreshIcon from '@material-ui/icons/Refresh'
import BackupIcon from '@material-ui/icons/Backup'
import Badge from '@material-ui/core/Badge'
import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'
import Tooltip from '@material-ui/core/Tooltip'

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
    <Tooltip title="Обновить данные">
      <StyledBadge badgeContent={changedNum}>
        <IconButton
          onClick={syncData}
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

const mapStateToProps = state => ({
  changedNum: getChangedNum(state),
  lastSync: getLastSyncTime(state),
  isPending: getPendingState(state),
})

const mapDispatchToProps = dispatch => ({
  syncData: () => dispatch(syncData()),
})

export default connect(mapStateToProps, mapDispatchToProps)(RefreshButton)

import React from 'react'
import { connect } from 'react-redux'
import { syncData } from 'logic/sync'
import { getChangedNum } from 'store/data/dataSelectors'
import { getLastSyncTime } from 'store/data/serverTimestamp'
import { getPendingState } from 'store/isPending'
import CircularProgress from '@material-ui/core/CircularProgress'
import RefreshIcon from '@material-ui/icons/Refresh'
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
      <StyledBadge badgeContent={changedNum} color="primary">
        <IconButton
          onClick={syncData}
          variant={changedNum ? 'contained' : 'outlined'}
          {...rest}
        >
          {isPending ? <CircularProgress size={24} /> : <RefreshIcon />}
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RefreshButton)

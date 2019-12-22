import React from 'react'
import { connect } from 'react-redux'
import { getLoginState } from 'store/token'
import { syncData } from 'logic/sync'
import { getLastSyncTime } from 'store/data/serverData'
import { getLastChangeTime } from 'store/data/dataSelectors'
import { getPendingState } from 'store/isPending'
import { loadLocalData } from 'logic/localData'

const SYNC_DELAY = 10 * 60 * 1000 // 10min
const CHECK_DELAY = 20 * 1000 // 20sec
let timer = null

class RegularSyncHandler extends React.Component {
  componentDidMount = () => {
    this.props.loadLocalData().then(this.checkSync)
    window.addEventListener('beforeunload', this.beforeUnload)
  }

  componentWillUnmount = () => {
    window.removeEventListener('beforeunload', this.beforeUnload)
    window.clearTimeout(timer)
  }

  beforeUnload = e => {
    if (this.props.lastChange) {
      window.alert('UNSAVED CHANGES')
      ;(e || window.event).returnValue = null
      return null
    }
  }

  checkSync = () => {
    const checkSync = this.checkSync
    const { lastSync, sync, isLoggedIn, lastChange, isPending } = this.props
    const isOnline = window.navigator.onLine

    // Regular sync conditions
    const needRegularSync = Date.now() - lastSync > SYNC_DELAY
    const hasUnsavedChanges = !!lastChange
    const itsTimeToSyncChanges = Date.now() - lastChange > CHECK_DELAY
    if (
      isLoggedIn &&
      !isPending &&
      isOnline &&
      (needRegularSync || (hasUnsavedChanges && itsTimeToSyncChanges))
    ) {
      sync()
    }

    timer = setTimeout(checkSync, CHECK_DELAY)
  }

  render() {
    return this.props.children || null
  }
}

const mapStateToProps = state => ({
  isLoggedIn: getLoginState(state),
  lastSync: getLastSyncTime(state),
  lastChange: getLastChangeTime(state),
  isPending: getPendingState(state),
})

const mapDispatchToProps = dispatch => ({
  sync: () => dispatch(syncData()),
  loadLocalData: () => dispatch(loadLocalData()),
})

export default connect(mapStateToProps, mapDispatchToProps)(RegularSyncHandler)

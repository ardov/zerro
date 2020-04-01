import React from 'react'
import { withRouter } from 'react-router'
import RefreshButton from 'components/RefreshButton'
import SettingsMenu from './SettingsMenu'
import SettingsIcon from '@material-ui/icons/Settings'
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Divider,
} from '@material-ui/core'
import AccountBalanceIcon from '@material-ui/icons/AccountBalance'
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet'
import SyncAltIcon from '@material-ui/icons/SyncAlt'
import { makeStyles } from '@material-ui/styles'
import json2mq from 'json2mq'
import useMediaQuery from '@material-ui/core/useMediaQuery'

const useStyles = makeStyles(theme => ({ action: { minWidth: 32 } }))

const routes = [
  { path: '/budget', label: 'Бюджет', icon: <AccountBalanceIcon /> },
  { path: '/transactions', label: 'Операции', icon: <SyncAltIcon /> },
  { path: '/accounts', label: 'Счета', icon: <AccountBalanceWalletIcon /> },
]

const MobileNav = ({ location, history, ...rest }) => {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const c = useStyles()

  const handleMenuClick = event => setAnchorEl(event.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)
  const handleChange = (e, newValue) => {
    if (newValue[0] === '/') history.push(newValue)
  }

  const iPhoneXXS11ProMediaQuery = json2mq({
    screen: true,
    minDeviceWidth: 375,
    maxDeviceWidth: 812,
    '-webkit-device-pixel-ratio': 3
  })

  const iPhoneXR11MediaQuery = json2mq({
    screen: true,
    minDeviceWidth: 414,
    maxDeviceWidth: 896,
    '-webkit-device-pixel-ratio': 2
  })

  const iPhoneXSMax11ProMaxMediaQuery = json2mq({
    screen: true,
    minDeviceWidth: 414,
    maxDeviceWidth: 896,
    '-webkit-device-pixel-ratio': 3
  })

  const isiPhoneWithHomeBar =
    useMediaQuery(`${iPhoneXXS11ProMediaQuery}, ${iPhoneXR11MediaQuery}, ${iPhoneXSMax11ProMaxMediaQuery}`)

  // I don't know why, but for iPhone 8 Plus media query above is met.
  const isiPhone8Plus = (window.screen.height / window.screen.width === 736 / 414) && (window.devicePixelRatio === 3)

  let paddingBottom = 0
  if (isiPhoneWithHomeBar && window.navigator.standalone && !isiPhone8Plus) {
    paddingBottom = 25
  }

  return (
    <Box position="fixed" width="100%" bottom="0" paddingBottom={paddingBottom + 'px'} zIndex="5" clone>
      <Paper>
        <Divider light />

        <BottomNavigation value={location.pathname} onChange={handleChange}>
          {routes.map(route => (
            <BottomNavigationAction
              className={c.action}
              label={route.label}
              value={route.path}
              icon={route.icon}
              key={route.path}
            />
          ))}
          <BottomNavigationAction
            label="Меню"
            className={c.action}
            value="menu"
            icon={<SettingsIcon />}
            onClick={handleMenuClick}
          />
          <RefreshButton isMobile={true} className={c.action} />
        </BottomNavigation>

        <SettingsMenu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        />
      </Paper>
    </Box>
  )
}

export default withRouter(MobileNav)

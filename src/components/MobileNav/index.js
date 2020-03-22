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

  return (
    <Box position="fixed" width="100%" bottom="0" zIndex="5" clone>
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

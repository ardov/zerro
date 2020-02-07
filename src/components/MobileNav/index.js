import React from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import RefreshButton from './RefreshButton'
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

const routes = [
  { path: '/budget', label: 'Бюджет', icon: <AccountBalanceIcon /> },
  { path: '/transactions', label: 'Операции', icon: <SyncAltIcon /> },
  { path: '/accounts', label: 'Счета', icon: <AccountBalanceWalletIcon /> },
]

const MobileNav = ({ location, ...rest }) => {
  const [anchorEl, setAnchorEl] = React.useState(null)

  const handleMenuClick = event => setAnchorEl(event.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)

  return (
    <Box position="fixed" width="100%" bottom="0" zIndex="5" clone>
      <Paper>
        <Divider light />

        <BottomNavigation value={location.pathname}>
          {routes.map(route => (
            <BottomNavigationAction
              label={route.label}
              value={route.path}
              icon={route.icon}
              key={route.path}
              component={Link}
              to={route.path}
            />
          ))}
          <BottomNavigationAction
            label="Меню"
            value="menu"
            icon={<SettingsIcon />}
            onClick={handleMenuClick}
          />
          <RefreshButton />
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

import React, { FC } from 'react'
import { useLocation, useHistory } from 'react-router'
import RefreshButton from 'components/RefreshButton'
import { SettingsMenu } from './MenuButton'
import SettingsIcon from '@material-ui/icons/Settings'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Divider,
} from '@material-ui/core'
import AccountBalanceIcon from '@material-ui/icons/AccountBalance'
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet'
import SyncAltIcon from '@material-ui/icons/SyncAlt'
import { makeStyles } from '@material-ui/styles'
import { useHomeBar } from 'helpers/useHomeBar'

const useStyles = makeStyles(theme => ({ action: { minWidth: 32 } }))

const routes = [
  { path: '/budget', label: 'Бюджет', icon: <AccountBalanceIcon /> },
  { path: '/transactions', label: 'Операции', icon: <SyncAltIcon /> },
  { path: '/accounts', label: 'Счета', icon: <AccountBalanceWalletIcon /> },
]

export const MobileNavigation: FC = props => {
  const path = useLocation().pathname
  const history = useHistory()
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const c = useStyles()
  const handleMenuClose = () => setAnchorEl(null)
  const hasHomeBar = useHomeBar()
  const paddingBottom = hasHomeBar ? '20px' : '0px'
  const currentRoute = routes.find(route => path.startsWith(route.path))

  return (
    <Paper
      sx={{
        position: 'fixed',
        width: '100%',
        bottom: '0',
        paddingBottom: paddingBottom,
        zIndex: 5,
      }}
    >
      <Divider light />

      <BottomNavigation
        value={currentRoute?.path}
        onChange={(e, newValue) => {
          if (newValue[0] === '/') history.push(newValue)
        }}
      >
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
          onClick={e => setAnchorEl(e.currentTarget)}
        />
        <RefreshButton isMobile={true} className={c.action} />
      </BottomNavigation>

      <SettingsMenu anchorEl={anchorEl} onClose={handleMenuClose} showLinks />
    </Paper>
  )
}

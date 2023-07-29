import React, { FC } from 'react'
import { useLocation, useHistory } from 'react-router'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Divider,
} from '@mui/material'
import {
  AccountBalanceIcon,
  AccountBalanceWalletIcon,
  SettingsIcon,
  SyncAltIcon,
} from '@shared/ui/Icons'
import { useHomeBar } from '@shared/hooks/useHomeBar'
import RefreshButton from 'widgets/RefreshButton'
import { SettingsMenu, useSettingsMenu } from './SettingsMenu'

const actionSx = { minWidth: 32 }
const routes = [
  { path: '/budget', label: 'Бюджет', icon: <AccountBalanceIcon /> },
  { path: '/transactions', label: 'Операции', icon: <SyncAltIcon /> },
  { path: '/accounts', label: 'Счета', icon: <AccountBalanceWalletIcon /> },
]

export const MobileNavigation: FC = () => {
  const path = useLocation().pathname
  const history = useHistory()
  const openSettings = useSettingsMenu()

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
            label={route.label}
            value={route.path}
            icon={route.icon}
            key={route.path}
            sx={actionSx}
          />
        ))}
        <BottomNavigationAction
          label="Меню"
          value="menu"
          icon={<SettingsIcon />}
          onClick={openSettings}
          sx={actionSx}
        />
        <RefreshButton isMobile={true} sx={actionSx} />
      </BottomNavigation>

      <SettingsMenu showLinks />
    </Paper>
  )
}

import React, { FC } from 'react'
import { useLocation, useHistory } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Divider,
} from '@mui/material'
import {
  AccountBalanceIcon,
  BarChartIcon,
  SettingsIcon,
  SyncAltIcon,
} from '6-shared/ui/Icons'
import { useHomeBar } from '6-shared/hooks/useHomeBar'
import RefreshButton from '3-widgets/RefreshButton'
import { SettingsMenu, useSettingsMenu } from './SettingsMenu'

const actionSx = { minWidth: 32 }

export const MobileNavigation: FC = () => {
  const { t } = useTranslation('navigation')
  const path = useLocation().pathname
  const history = useHistory()
  const openSettings = useSettingsMenu()

  const hasHomeBar = useHomeBar()
  const paddingBottom = hasHomeBar ? '20px' : '0px'

  const routes = [
    { path: '/budget', label: t('budget'), icon: <AccountBalanceIcon /> },
    { path: '/transactions', label: t('transactions'), icon: <SyncAltIcon /> },
    { path: '/stats', label: t('stats'), icon: <BarChartIcon /> },
  ]
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
          label={t('settings')}
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

import type { FC } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

export const MobileNavigation: FC = () => {
  const { t } = useTranslation('navigation')
  const path = useLocation().pathname
  const navigate = useNavigate()
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
    <Paper className="fixed bottom-0 z-[5] w-full" style={{ paddingBottom }}>
      <Divider className="opacity-60" />
      <BottomNavigation
        value={currentRoute?.path}
        onChange={(e, newValue) => {
          if (newValue[0] === '/') navigate(newValue)
        }}
      >
        {routes.map(route => (
          <BottomNavigationAction
            label={route.label}
            value={route.path}
            icon={route.icon}
            key={route.path}
            className="min-w-8"
          />
        ))}
        <BottomNavigationAction
          label={t('settings')}
          value="menu"
          icon={<SettingsIcon />}
          onClick={openSettings}
          className="min-w-8"
        />
        <RefreshButton isMobile={true} className="min-w-8" />
      </BottomNavigation>
      <SettingsMenu showLinks />
    </Paper>
  )
}

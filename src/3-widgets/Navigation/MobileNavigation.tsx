import type { FC } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AccountBalanceIcon,
  BarChartIcon,
  SettingsIcon,
  SyncAltIcon,
} from '6-shared/ui/Icons'
import { useHomeBar } from '6-shared/hooks/useHomeBar'
import RefreshButton from '3-widgets/RefreshButton'
import { useAsk } from '6-shared/overlays'
import { SettingsMenu } from './SettingsMenu'

export const MobileNavigation: FC = () => {
  const { t } = useTranslation('navigation')
  const path = useLocation().pathname
  const navigate = useNavigate()
  const ask = useAsk()

  const hasHomeBar = useHomeBar()
  const paddingBottom = hasHomeBar ? '20px' : '0px'

  const routes = [
    { path: '/budget', label: t('budget'), icon: <AccountBalanceIcon /> },
    { path: '/transactions', label: t('transactions'), icon: <SyncAltIcon /> },
    { path: '/stats', label: t('stats'), icon: <BarChartIcon /> },
  ]
  const currentRoute = routes.find(route => path.startsWith(route.path))

  return (
    <nav
      className="fixed bottom-0 z-[5] w-full bg-card shadow-elevation-1"
      style={{ paddingBottom }}
    >
      <hr className="m-0 border-0 border-t border-border opacity-60" />
      <div className="flex min-h-14 items-stretch">
        {routes.map(route => (
          <button
            type="button"
            key={route.path}
            aria-current={
              currentRoute?.path === route.path ? 'page' : undefined
            }
            onClick={() => navigate(route.path)}
            className={navigationActionClass(currentRoute?.path === route.path)}
          >
            {route.icon}
            <span className="type-caption">{route.label}</span>
          </button>
        ))}
        <button
          type="button"
          aria-label={t('settings')}
          onClick={e =>
            ask(<SettingsMenu showLinks anchorEl={e.currentTarget} />)
          }
          className={navigationActionClass(false)}
        >
          <SettingsIcon />
          <span className="type-caption">{t('settings')}</span>
        </button>
        <RefreshButton isMobile className={navigationActionClass(false)} />
      </div>
    </nav>
  )
}

const navigationActionClass = (selected: boolean) =>
  [
    'relative flex min-w-8 flex-1 flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-1 py-1 font-sans text-icon-foreground transition-colors hover:bg-accent focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
    selected && 'text-primary',
  ]
    .filter(Boolean)
    .join(' ')

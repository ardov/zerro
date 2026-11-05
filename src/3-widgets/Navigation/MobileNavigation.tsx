import type { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import RefreshButton from '@/3-widgets/RefreshButton'
import { NavigationAction } from './NavigationAction'
import { MenuButton } from './MenuButton'
import { useDestinations } from './destinations'

import './MobileNavigation.css'

/** The bottom bar of a narrow window: destinations and settings as icons, and
 * Sync beside them as a separate round button — it is an action, not a
 * place. About moves into the settings panel. */
export const MobileNavigation: FC = () => {
  const { t } = useTranslation('navigation')
  const path = useLocation().pathname
  const destinations = useDestinations({
    mobile: true,
    accountsPanelFits: false,
  })
  const current = destinations.find(d => path.startsWith(d.path))

  return (
    <nav aria-label={t('main')} className="mobile-navigation">
      <div aria-hidden className="mobile-navigation-blur" />
      <div aria-hidden className="mobile-navigation-color" />
      <div className="mobile-navigation-actions">
        <div className="flex min-w-0 grow self-stretch">
          {destinations.map(destination => {
            const selected = current?.path === destination.path
            return (
              <NavigationAction
                key={destination.path}
                nativeButton={false}
                role="link"
                render={<Link to={destination.path} />}
                label={destination.label}
                icon={destination.icon}
                aria-current={selected ? 'page' : undefined}
              />
            )
          })}
          <MenuButton />
        </div>
        <div className="mobile-navigation-sync flex size-12 shrink-0 items-center justify-center">
          <RefreshButton shape="circle" muted />
        </div>
      </div>
    </nav>
  )
}

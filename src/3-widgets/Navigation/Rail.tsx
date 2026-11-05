import type { FC } from 'react'
import { Link, useMatch } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NavigationAction } from './NavigationAction'
import { LogoMark } from '@/6-shared/ui/Logo'
import RefreshButton from '@/3-widgets/RefreshButton'
import { MenuButton } from './MenuButton'
import { type TDestination, useDestinations } from './destinations'

/** The icon-only strip of destinations on the left of a wide window. It sits
 * on the canvas, not on a panel, and holds no lists of data. */
export const Rail: FC<{ accountsPanelFits: boolean }> = ({
  accountsPanelFits,
}) => {
  const { t } = useTranslation('navigation')
  const destinations = useDestinations({ mobile: false, accountsPanelFits })
  return (
    <nav
      aria-label={t('main')}
      className="flex h-full w-[56px] shrink-0 flex-col items-center gap-2 py-3"
    >
      <Link
        to="/transactions"
        aria-label="Zerro"
        className="focusable flex h-12 self-stretch items-center justify-center rounded-ui-control-inner rounded-smooth text-ui-primary"
      >
        <LogoMark width={28} height={28} />
      </Link>

      <ul className="m-0 my-auto flex list-none flex-col gap-1 self-stretch p-0">
        {destinations.map(destination => (
          <RailLink key={destination.path} {...destination} />
        ))}
      </ul>

      <div className="flex flex-col items-center gap-2 self-stretch">
        <MenuButton tooltipSide="right" />
        <RefreshButton tooltipSide="right" />
      </div>
    </nav>
  )
}

const RailLink: FC<TDestination> = ({ path, label, icon }) => {
  const current = !!useMatch({ path, end: false })
  return (
    <li className="contents">
      <NavigationAction
        icon={icon}
        label={label}
        tooltipSide="right"
        nativeButton={false}
        role="link"
        render={<Link to={path} />}
        aria-current={current ? 'page' : undefined}
      />
    </li>
  )
}

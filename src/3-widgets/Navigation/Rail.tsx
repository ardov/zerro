import type { FC, ReactNode } from 'react'
import { Link, useMatch } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { LogoMark } from '@/6-shared/ui/Logo'
import { panelWidths } from '@/6-shared/ui/layout/panelWidths'
import RefreshButton from '@/3-widgets/RefreshButton'
import { MenuButton } from './MenuButton'
import { useDestinations } from './destinations'

/** The icon-only strip of destinations on the left of a wide window. It sits
 * on the canvas, not on a panel, and holds no lists of data. */
export const Rail: FC = () => {
  const { t } = useTranslation('navigation')
  const destinations = useDestinations({ includeAbout: true })
  return (
    <nav
      aria-label={t('main')}
      className="flex h-full shrink-0 flex-col items-center gap-2 py-2"
      style={{ width: panelWidths.rail }}
    >
      <Link
        to="/budget"
        aria-label="Zerro"
        className="focusable flex size-10 items-center justify-center rounded-ui-control-inner text-foreground"
      >
        <LogoMark width={28} height={28} />
      </Link>

      <ul className="m-0 my-auto flex list-none flex-col gap-1 p-0">
        {destinations.map(destination => (
          <RailLink key={destination.path} {...destination} />
        ))}
      </ul>

      <div className="flex flex-col items-center gap-1">
        <RefreshButton />
        <MenuButton tooltipSide="right" />
      </div>
    </nav>
  )
}

const RailLink: FC<{ path: string; label: string; icon: ReactNode }> = ({
  path,
  label,
  icon,
}) => {
  const current = !!useMatch({ path, end: false })
  return (
    <li className="contents">
      <IconButton
        variant="ghost"
        size="sm"
        label={label}
        tooltipSide="right"
        nativeButton={false}
        render={<Link to={path} />}
        aria-current={current ? 'page' : undefined}
        className="aria-[current=page]:bg-ui-highlight aria-[current=page]:text-ui-primary"
      >
        {icon}
      </IconButton>
    </li>
  )
}

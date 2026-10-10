import type { FC } from 'react'
import { useLayoutEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SettingsIcon } from '@/6-shared/ui/Icons'
import { useHomeBar } from '@/6-shared/hooks/useHomeBar'
import { cn } from '@/6-shared/ui/shadcn/utils'
import RefreshButton from '@/3-widgets/RefreshButton'
import { useAsk } from '@/6-shared/overlays'
import { SettingsMenu } from './SettingsMenu'
import { useDestinations } from './destinations'

/** The bar's geometry, in pixels: the gap above it, its own height, and the
 * gap under it — wider over a home indicator. */
const BAR = { top: 4, height: 48, bottom: 4, bottomOverHomeBar: 20 }

const barSurfaceClass =
  'bg-white/90 shadow-elevation-1 inset-ring-1 inset-ring-ui-border backdrop-blur-[1.5px] dark:bg-black/90'

/** The bottom bar of a narrow window: destinations and settings as icons, and
 * Sync beside them as a separate round button — it is an action, not a
 * place. About moves into the settings menu.
 *
 * It reports how much of the window it covers as it changes, so the page
 * can keep room for it at the end of every scroller. */
export const MobileNavigation: FC<{
  onHeightChange: (height: number) => void
}> = ({ onHeightChange }) => {
  const { t } = useTranslation('navigation')
  const nav = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const element = nav.current
    if (!element) return
    const report = () => onHeightChange(element.offsetHeight)
    report()
    const observer = new ResizeObserver(report)
    observer.observe(element)
    return () => {
      observer.disconnect()
      onHeightChange(0)
    }
  }, [onHeightChange])
  const path = useLocation().pathname
  const ask = useAsk()
  const destinations = useDestinations()
  const current = destinations.find(d => path.startsWith(d.path))
  const hasHomeBar = useHomeBar()

  return (
    <nav
      ref={nav}
      aria-label={t('main')}
      // Transparent and click-through around the bar and the button: the page
      // scrolls on under them.
      className="pointer-events-none fixed bottom-0 z-[5] flex w-full items-center gap-2 px-2 *:pointer-events-auto"
      style={{
        paddingTop: BAR.top,
        paddingBottom: hasHomeBar ? BAR.bottomOverHomeBar : BAR.bottom,
      }}
    >
      <div
        className={cn(
          'flex grow items-stretch overflow-hidden rounded-lg',
          barSurfaceClass
        )}
        style={{ height: BAR.height }}
      >
        {destinations.map(destination => {
          const selected = current?.path === destination.path
          return (
            <Link
              key={destination.path}
              to={destination.path}
              aria-label={destination.label}
              aria-current={selected ? 'page' : undefined}
              className={navigationActionClass(selected)}
            >
              {destination.icon}
            </Link>
          )
        })}
        <button
          type="button"
          aria-label={t('settings')}
          onClick={() => ask(<SettingsMenu />)}
          className={navigationActionClass(false)}
        >
          <SettingsIcon />
        </button>
      </div>
      <div
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-full',
          barSurfaceClass
        )}
      >
        <RefreshButton shape="circle" muted />
      </div>
    </nav>
  )
}

const navigationActionClass = (selected: boolean) =>
  cn(
    'relative flex min-w-8 flex-1 items-center justify-center border-0 bg-transparent font-sans text-ui-secondary no-underline transition-colors hover:bg-ui-highlight focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ui-focus',
    selected && 'text-ui-primary'
  )

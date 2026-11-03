import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { LogoMark } from '@/6-shared/ui/Logo'
import { Button } from '@/6-shared/ui/kit/Button'
import { CurrencyBackground } from '../Auth/CurrencyBackground/CurrencyBackground'
import './NotFound.css'

/** Drawn on the mark's 100-unit scale, with an 18-unit stem and a 14-unit crossbar. */
function Four() {
  return (
    <span className="not-found-four" aria-hidden="true">
      <svg viewBox="0 0 70 100" fill="currentColor" className="block w-full">
        <path
          fillRule="evenodd"
          d="M42 2h18v59h10v14H60v23H42V75H1V61L42 2Zm0 59V24L16.5 61Z"
        />
      </svg>
    </span>
  )
}

export function NotFound({
  homeLink = <a href="/" />,
}: {
  homeLink?: ReactElement
}) {
  const { t } = useTranslation()
  return (
    <section
      aria-describedby="not-found-description"
      className="relative isolate flex w-full flex-1 flex-col items-center justify-center gap-14 overflow-clip bg-ui-base p-6 pb-[calc(1.5rem+var(--mobile-navigation-inset,env(safe-area-inset-bottom,0px)))] text-ui-primary"
    >
      <CurrencyBackground />
      <h1
        aria-label="404"
        className="relative grid w-[min(100%,52rem,100svh)] grid-cols-[70fr_76fr_70fr] gap-x-[5%] text-black select-none dark:text-white"
      >
        <Four />
        <LogoMark
          viewBox="0 0 76 100"
          className="block w-full not-found-logo"
          aria-hidden="true"
        />
        <Four />
      </h1>
      <p id="not-found-description" className="sr-only">
        {t('pageNotFound')}
      </p>
      <Button
        size="lg"
        nativeButton={false}
        role="link"
        render={homeLink}
        className="relative"
      >
        {t('returnToApp')}
      </Button>
    </section>
  )
}

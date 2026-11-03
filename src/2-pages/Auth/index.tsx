import { useAboutPath } from '@/6-shared/localization/useAboutPath'
import { Button, IconButton } from '@/6-shared/ui/kit/Button'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { zenmoney } from '@/6-shared/api/zenmoney'
import { Logo } from '@/6-shared/ui/Logo'
import { NightsStayIcon, WbSunnyIcon } from '@/6-shared/ui/Icons'
import { useColorScheme } from '@/6-shared/ui/theme'

import { useAppDispatch } from '@/store'
import { loadBackup, loadDemoData, logIn } from '@/4-features/authorization'

import { CurrencyBackground } from './CurrencyBackground/CurrencyBackground'
import './Auth.css'

/** Supplies the duration consumed by the co-located reveal animation. */
const reveal = (ms: number) =>
  ({ '--auth-reveal-duration': `${ms}ms` }) as CSSProperties

zenmoney.processAuthCode()

export default function Auth() {
  const dispatch = useAppDispatch()
  const { t, i18n } = useTranslation()
  const aboutPath = useAboutPath()
  const theme = useColorScheme()
  const russian = (i18n.resolvedLanguage || i18n.language).startsWith('ru')
  const nextLanguage = russian ? 'en' : 'ru'
  const dark = theme.mode === 'dark'
  const [logoIn, setLogoIn] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setLogoIn(true), 300)
    return () => clearTimeout(timer)
  }, [])
  const parseFiles = (fileList: FileList) => dispatch(loadBackup(fileList[0]))

  return (
    <main
      className="auth-page relative isolate flex min-h-svh flex-col p-6"
      data-dragging={isDragging || undefined}
      onDragOver={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onDragEnter={e => {
        e.stopPropagation()
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={e => {
        e.stopPropagation()
        e.preventDefault()
        setIsDragging(false)
      }}
      onDrop={e => {
        e.stopPropagation()
        e.preventDefault()
        parseFiles(e?.dataTransfer?.files)
      }}
    >
      <CurrencyBackground />
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
        <Button
          aria-label={russian ? 'Switch to English' : 'Переключить на русский'}
          lang={nextLanguage}
          variant="ghost"
          muted
          size="xs"
          onClick={() => void i18n.changeLanguage(nextLanguage)}
        >
          {nextLanguage.toUpperCase()}
        </Button>
        <IconButton
          label={t(dark ? 'settings:lightMode' : 'settings:darkMode')}
          variant="ghost"
          muted
          size="xs"
          onClick={theme.toggle}
        >
          {dark ? <WbSunnyIcon /> : <NightsStayIcon />}
        </IconButton>
      </div>
      <div className="auth-layout relative z-10 mx-auto grid w-full flex-1">
        <section className="flex flex-col items-start self-center py-12">
          <Logo
            width="160"
            fill="var(--color-ui-primary)"
            visible={logoIn}
            role="img"
            aria-label="Zerro"
          />
          <h1
            className="auth-heading auth-reveal mt-10 mb-0 font-medium"
            style={reveal(1000)}
          >
            {t('authHeading')}
          </h1>

          <div
            className="auth-reveal mt-14 flex flex-wrap items-center gap-3"
            style={reveal(2000)}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => dispatch(logIn(russian ? 'ru' : 'app'))}
            >
              {t('btnLogin')}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => dispatch(loadDemoData())}
            >
              {t('btnDemoMode')}
            </Button>
          </div>
        </section>
        <footer
          className="auth-reveal flex flex-wrap items-center gap-x-6 gap-y-2 text-body text-ui-secondary"
          style={reveal(3000)}
        >
          <RouterLink
            to={aboutPath}
            className="-m-2 rounded-ui-control-inner p-2 no-underline hover:text-ui-primary focusable"
          >
            {t('btnAbout')}
          </RouterLink>
        </footer>
      </div>
    </main>
  )
}

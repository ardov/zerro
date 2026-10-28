import { Button } from '@/6-shared/ui/kit/Button'
import { ButtonBase } from '@/6-shared/ui/kit/ButtonBase'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { zenmoney } from '@/6-shared/api/zenmoney'
import { Logo } from '@/6-shared/ui/Logo'

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
  const { t } = useTranslation()
  const [logoIn, setLogoIn] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setLogoIn(true), 300)
    return () => clearTimeout(timer)
  }, [])
  const parseFiles = (fileList: FileList) => dispatch(loadBackup(fileList[0]))

  return (
    <div
      className="auth-page relative isolate flex min-h-screen flex-col items-center justify-center gap-16 p-6"
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
      <div className="relative z-10 flex flex-col items-center gap-16">
        <Logo width="200" fill="var(--color-ui-primary)" visible={logoIn} />
        <div className="flex flex-col items-center justify-center gap-6">
          <Button
            className="auth-reveal"
            style={reveal(1000)}
            variant="primary"
            size="lg"
            onClick={() => dispatch(logIn('ru'))}
            children={t('btnLogin')}
          />

          <p
            className="auth-reveal m-0 text-body text-ui-secondary"
            style={reveal(2000)}
          >
            {t('haveTrouble')}{' '}
            <ButtonBase
              onClick={() => dispatch(logIn('app'))}
              className="-m-2 inline p-2 align-baseline text-[length:inherit] leading-[inherit] font-[inherit] rounded-lg text-ui-link focusable"
            >
              {t('btnAlternativeSignIn')}
            </ButtonBase>
          </p>

          <div className="auth-reveal mt-4" style={reveal(3000)}>
            <Button
              render={<RouterLink to="/about" />}
              nativeButton={false}
              variant="ghost"
              size="lg"
            >
              {t('btnAbout')}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => dispatch(loadDemoData())}
            >
              {t('btnDemoMode')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

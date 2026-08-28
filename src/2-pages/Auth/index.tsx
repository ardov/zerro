import { Button, ButtonBase } from '6-shared/ui/Button'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Fade } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '6-shared/ui/theme'
import { zenmoney } from '6-shared/api/zenmoney'
import { Logo } from '6-shared/ui/Logo'

import { useAppDispatch } from 'store'
import { loadBackup, loadDemoData, logIn } from '4-features/authorization'

zenmoney.processAuthCode()

export default function Auth() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [logoIn, setLogoIn] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  setTimeout(() => setLogoIn(true), 300)
  const parseFiles = (fileList: FileList) => dispatch(loadBackup(fileList[0]))

  const dragOverStyle = {
    background: theme.palette.action.focus,
    transform: 'scale(1.1)',
    transition: `300ms ${theme.transitions.easing.easeInOut}`,
  }
  const defaultStyle = {
    transform: 'scale(1)',
    transition: `300ms ${theme.transitions.easing.easeInOut}`,
  }
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-16 p-6"
      style={isDragging ? dragOverStyle : defaultStyle}
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
      <Logo width="200" fill={theme.palette.primary.main} visible={logoIn} />
      <div className="flex flex-col items-center justify-center gap-6">
        <Fade in timeout={1000}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => dispatch(logIn('ru'))}
            children={t('btnLogin')}
          />
        </Fade>

        <Fade in timeout={2000}>
          <p className="m-0 type-body text-muted-foreground">
            {t('haveTrouble')}{' '}
            <ButtonBase
              onClick={() => dispatch(logIn('app'))}
              className="-m-2 inline p-2 align-baseline text-[length:inherit] leading-[inherit] font-[inherit] rounded-lg text-primary hover:text-interactive focus:text-interactive"
            >
              {t('btnAlternativeSignIn')}
            </ButtonBase>
          </p>
        </Fade>

        <Fade in timeout={3000}>
          <div className="mt-4">
            <Button
              render={<RouterLink to="/about" />}
              variant="text"
              color="primary"
              size="large"
            >
              {t('btnAbout')}
            </Button>
            <Button
              variant="text"
              color="primary"
              size="large"
              onClick={() => dispatch(loadDemoData())}
            >
              {t('btnDemoMode')}
            </Button>
          </div>
        </Fade>
      </div>
    </div>
  )
}

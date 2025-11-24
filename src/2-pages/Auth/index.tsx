import React, { FC, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Fade,
  Stack,
  ButtonOwnProps,
  Typography,
  ButtonBase,
} from '@mui/material'
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
    <Stack
      spacing={8}
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
      sx={{
        p: 3,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Logo width="200" fill={theme.palette.primary.main} visible={logoIn} />
      <Stack
        spacing={3}
        sx={{ justifyContent: 'center', alignItems: 'center' }}
      >
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
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('haveTrouble')}{' '}
            <ButtonBase
              onClick={() => dispatch(logIn('app'))}
              sx={{
                p: 1,
                m: -1,
                verticalAlign: 'baseline',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                lineHeight: 'inherit',
                borderRadius: 1,
                color: theme.palette.primary.main,
                '&:hover': {
                  color: theme.palette.secondary.main,
                },
                '&:focus': {
                  color: theme.palette.secondary.main,
                },
              }}
            >
              {t('btnAlternativeSignIn')}
            </ButtonBase>
          </Typography>
        </Fade>

        <Fade in timeout={3000}>
          <Box sx={{ mt: 2 }}>
            <RouterLink to="/about" component={SecondaryLink}>
              {t('btnAbout')}
            </RouterLink>
            <Button
              variant="text"
              color="primary"
              size="large"
              onClick={() => dispatch(loadDemoData())}
            >
              {t('btnDemoMode')}
            </Button>
          </Box>
        </Fade>
      </Stack>
    </Stack>
  )
}

const SecondaryLink: FC<ButtonOwnProps & { navigate: any }> = ({
  navigate,
  ...props
}) => <Button variant="text" color="primary" size="large" {...props} />

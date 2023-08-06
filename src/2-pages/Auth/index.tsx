import React, { FC, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Link, Fade, LinkProps } from '@mui/material'
import { useAppTheme } from '6-shared/ui/theme'
import { fakeToken } from '6-shared/config'
import { tokenStorage } from '6-shared/api/tokenStorage'
import { zenmoney } from '6-shared/api/zenmoney'
import { Logo } from '6-shared/ui/Logo'
import { useAppDispatch, AppThunk } from 'store'
import { applyServerPatch } from 'store/data'
import { setToken } from 'store/token'
import { logIn } from '4-features/authorization'
import { saveDataLocally } from '4-features/localData'
import { convertZmToLocal } from 'worker'
import { useTranslation } from 'react-i18next'

zenmoney.checkCode()

export default function Auth() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [logoIn, setLogoIn] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  setTimeout(() => setLogoIn(true), 300)
  const parseFiles = (fileList: FileList) => dispatch(loadFromFile(fileList[0]))

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
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
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
      <Box mb={5}>
        <Logo width="200" fill={theme.palette.primary.main} visible={logoIn} />
      </Box>

      <Fade in timeout={1000}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => dispatch(logIn())}
          children={t('btnLogin')}
        />
      </Fade>

      <Fade in timeout={3000}>
        <Box mt={2}>
          <RouterLink to="/about" component={SecondaryLink}>
            {t('btnAbout')}
          </RouterLink>
        </Box>
      </Fade>
    </Box>
  )
}

const SecondaryLink: FC<LinkProps> = props => (
  <Link variant="body1" {...props} />
)

const loadFromFile =
  (file: File): AppThunk<void> =>
  async (dispatch, getState) => {
    if (!file) return

    try {
      const txt = await file.text()
      const data = JSON.parse(txt)
      const converted = await convertZmToLocal(data)
      // TODO: maybe later make more elegant solution for local data
      dispatch(setToken(fakeToken))
      dispatch(applyServerPatch(converted))
      dispatch(saveDataLocally())
      tokenStorage.set(fakeToken)
    } catch (error) {
      console.log(error)
      return
    }
  }

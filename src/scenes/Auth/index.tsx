import React, { FC, useState } from 'react'
import Cookies from 'cookies-js'
import { useAppDispatch } from 'store'
import { Box, Button, Link, Fade, LinkProps } from '@mui/material'
import { logIn } from 'logic/authorization'
import ZenApi from 'services/ZenApi'
import { useTheme } from '@mui/material'
import { Logo } from '../../components/Logo'
import { applyServerPatch } from 'store/data'
import { setToken } from 'store/token'
import { saveDataLocally } from 'logic/localData'
import { Link as RouterLink } from 'react-router-dom'
import { convertZmToLocal } from 'worker'
import { AppThunk } from 'store'
ZenApi.checkCode()

export default function Auth() {
  const dispatch = useAppDispatch()
  const theme = useTheme()
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
          children="Войти через Дзен-мани"
        />
      </Fade>

      <Fade in timeout={3000}>
        <Box mt={2}>
          <RouterLink to="/about" component={SecondaryLink}>
            Что это такое?
          </RouterLink>
        </Box>
      </Fade>
    </Box>
  )
}

const SecondaryLink: FC<LinkProps> = props => (
  <Link variant="body1" {...props} />
)

const loadFromFile = (file: File): AppThunk => async (dispatch, getState) => {
  if (!file) return

  try {
    const txt = await file.text()
    const data = JSON.parse(txt)
    const converted = await convertZmToLocal(data)
    // TODO: maybe later make more elegant solution for local data
    dispatch(setToken('fakeToken'))
    dispatch(applyServerPatch(converted))
    dispatch(saveDataLocally())
    Cookies.set('token', 'fakeToken', { expires: new Date(2030, 1) })
  } catch (error) {
    console.log(error)
    return
  }
}

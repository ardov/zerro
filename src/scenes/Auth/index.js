import React, { useState } from 'react'
import Cookies from 'cookies-js'
import { useDispatch } from 'react-redux'
import { Box, Button, Link, Fade } from '@material-ui/core'
import { logIn } from 'logic/authorization'
import ZenApi from 'services/ZenApi'
import { useTheme } from '@material-ui/styles'
import Logo from '../../components/Logo'
import { updateData } from 'store/commonActions'
import { setToken } from 'store/token'
import { saveDataLocally } from 'logic/localData'
ZenApi.checkCode()

export default function Auth(props) {
  const dispatch = useDispatch()
  const theme = useTheme()
  const [logoIn, setLogoIn] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  setTimeout(() => setLogoIn(true), 300)
  const parseFiles = fileList => dispatch(loadFromFile(fileList[0]))

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
          <Link
            href="https://www.notion.so/ZERRO-a943f930d0a64d008712e20ecd299dbd"
            target="_blank"
            rel="noopener noreferrer"
            variant="body1"
            children="Что это такое?"
          />
        </Box>
      </Fade>
    </Box>
  )
}

const loadFromFile = file => async (dispatch, getState) => {
  if (!file) return
  let data = {}
  try {
    const txt = await file.text()
    data = JSON.parse(txt)
  } catch (error) {
    console.log(error)
    return
  }
  dispatch(setToken('fakeToken'))
  dispatch(updateData({ data }))
  dispatch(saveDataLocally())
  Cookies.set('token', 'fakeToken', { expires: new Date(2030, 1) })
}

import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import { getToken } from 'store/token'
import { useSelector } from 'react-redux'
import { Helmet } from 'react-helmet'

export default function Token() {
  const token = useSelector(getToken)
  const [tokenIsVisible, setTokenVisibility] = React.useState(false)

  return (
    <>
      <Helmet>
        <title>Токен | Zerro</title>
        <meta name="description" content="" />
        <link rel="canonical" href="https://zerro.app/token" />
      </Helmet>

      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="inherit"
      >
        <Box p={5} mx="auto" maxWidth={500}>
          <Typography variant="h4" paragraph>
            ⚠️ Внимание
          </Typography>

          <Typography variant="body1" paragraph>
            Токен даёт бессрочный доступ к вашему аккаунту. Приложения
            используют токен вместо логина и пароля, чтобы получать данные.
            Используйте его аккуратно и храните в безопасном месте.
          </Typography>

          <Box mt={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setTokenVisibility(!tokenIsVisible)}
            >
              {tokenIsVisible ? 'Скрыть токен' : 'Показать токен'}
            </Button>
          </Box>

          {tokenIsVisible ? <h3>{token}</h3> : null}
        </Box>
      </Box>
    </>
  )
}

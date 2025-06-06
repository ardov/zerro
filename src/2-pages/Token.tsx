import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useTranslation } from 'react-i18next'
import { getToken } from 'store/token'
import { useAppSelector } from 'store'

export default function Token() {
  const { t } = useTranslation('token')
  const token = useAppSelector(getToken)
  const [tokenIsVisible, setTokenVisibility] = React.useState(false)

  return (
    <>
      <Helmet>
        <title>{t('pageTitle')} | Zerro</title>
        <meta name="description" content={t('pageDescription')} />
        <link rel="canonical" href="https://zerro.app/token" />
      </Helmet>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'inherit',
        }}
      >
        <Box sx={{ p: 5, mx: 'auto', maxWidth: 500 }}>
          <Typography variant="h4" sx={{ marginBottom: '16px' }}>
            {t('heading')}
          </Typography>

          <Typography variant="body1" sx={{ marginBottom: '16px' }}>
            {t('body')}
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setTokenVisibility(!tokenIsVisible)}
            >
              {t(tokenIsVisible ? 'btnHide' : 'btnShow')}
            </Button>
          </Box>

          {tokenIsVisible ? <h3>{token}</h3> : null}
        </Box>
      </Box>
    </>
  )
}

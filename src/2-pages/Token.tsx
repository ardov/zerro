import React from 'react'
import { Button, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { getToken } from 'store/token'
import { useAppSelector } from 'store'

export default function Token() {
  const { t } = useTranslation('token')
  const token = useAppSelector(getToken)
  const [tokenIsVisible, setTokenVisibility] = React.useState(false)

  return (
    <>
      <title>{`${t('pageTitle')} | Zerro`}</title>
      <meta name="description" content={t('pageDescription')} />
      <link rel="canonical" href="https://zerro.app/token" />
      <div className="flex h-inherit items-center justify-center">
        <div className="mx-auto max-w-[500px] p-10">
          <Typography variant="h4" className="mb-4">
            {t('heading')}
          </Typography>

          <Typography variant="body1" className="mb-4">
            {t('body')}
          </Typography>

          <div className="mt-6">
            <Button
              variant="contained"
              color="primary"
              onClick={() => setTokenVisibility(!tokenIsVisible)}
            >
              {t(tokenIsVisible ? 'btnHide' : 'btnShow')}
            </Button>
          </div>

          {tokenIsVisible ? <h3>{token}</h3> : null}
        </div>
      </div>
    </>
  )
}

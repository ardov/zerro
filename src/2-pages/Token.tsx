import React from 'react'
import { Button } from '@mui/material'
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
      <div className="flex h-[inherit] items-center justify-center">
        <div className="mx-auto max-w-[500px] p-10">
          <h1 className="mt-0 mb-4 type-display">{t('heading')}</h1>

          <p className="mt-0 mb-4 type-body">{t('body')}</p>

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

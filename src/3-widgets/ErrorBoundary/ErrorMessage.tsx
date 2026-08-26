import type { FC } from 'react'
import { Button } from '@mui/material'
import { SyncIcon } from '6-shared/ui/Icons'
import { useTranslation } from 'react-i18next'

interface ErrorMessageProps {
  onLogOut: () => void
  message: string
}

export const ErrorMessage: FC<ErrorMessageProps> = ({ onLogOut, message }) => {
  const { t } = useTranslation('errorBoudary')
  return (
    <div className="flex h-[inherit] items-center justify-center">
      <div className="mx-auto max-w-[500px] p-10">
        <h1 className="mb-4 type-display">{t('title')}</h1>

        <p className="mb-4 type-body">{t('description')}</p>

        <div className="mt-6">
          <Button
            variant="contained"
            color="primary"
            startIcon={<SyncIcon />}
            onClick={() => window.location.reload()}
          >
            {t('btnRefresh')}
          </Button>

          <Button onClick={onLogOut} className="ml-4">
            {t('btnLogOut')}
          </Button>

          {!!message && (
            <p className="mt-12 mb-4 type-body text-muted-foreground">
              {t('errorMsg', { message })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

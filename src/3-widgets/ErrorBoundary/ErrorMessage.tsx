import type { FC } from 'react'
import { Typography, Button } from '@mui/material'
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
        <Typography variant="h4" className="mb-4">
          {t('title')}
        </Typography>

        <Typography variant="body1" className="mb-4">
          {t('description')}
        </Typography>

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
            <Typography
              variant="body1"
              className="mt-12 mb-4 text-muted-foreground"
            >
              {t('errorMsg', { message })}
            </Typography>
          )}
        </div>
      </div>
    </div>
  )
}

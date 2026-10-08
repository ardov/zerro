import { Button } from '@/6-shared/ui/kit/Button'
import type { FC } from 'react'
import { SyncIcon } from '@/6-shared/ui/Icons'
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
        <h1 className="mt-0 mb-4 text-display">{t('title')}</h1>

        <p className="mt-0 mb-4 text-body">{t('description')}</p>

        <div className="mt-6">
          <Button
            size="sm"
            variant="primary"
            onClick={() => window.location.reload()}
          >
            <SyncIcon data-icon="inline-start" />
            {t('btnRefresh')}
          </Button>

          <Button variant="ghost" size="sm" onClick={onLogOut} className="ml-4">
            {t('btnLogOut')}
          </Button>

          {!!message && (
            <p className="mt-12 mb-4 text-body text-ui-secondary">
              {t('errorMsg', { message })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

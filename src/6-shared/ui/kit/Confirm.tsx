import { useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsked } from '@/6-shared/overlays'
import { AlertDialogSurface, DialogSurface } from './Dialog'
import { Button } from './Button'

export type ConfirmProps = {
  title?: string
  description?: string
  cancelText?: string
  okText?: string
  intent?: 'default' | 'danger'
}

/** Pass to useAsk<boolean>(); only explicit confirmation answers true.
 * Closing (including Back) always means cancel, even during pending work. */
export function Confirm({
  title,
  description,
  cancelText,
  okText,
  intent = 'default',
}: ConfirmProps) {
  const { t } = useTranslation('confirmDefaults')
  const { controller, answer } = useAsked<boolean>()
  const cancel = useRef<HTMLButtonElement>(null)
  const confirm = useRef<HTMLButtonElement>(null)
  const descriptionId = useId()
  const Surface = intent === 'danger' ? AlertDialogSurface : DialogSurface
  return (
    <Surface
      closeButton={false}
      controller={controller}
      title={title ?? t('title')}
      initialFocus={intent === 'danger' ? cancel : confirm}
      aria-describedby={description ? descriptionId : undefined}
    >
      {description && (
        <p id={descriptionId} className="mb-6 text-ui-secondary">
          {description}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button ref={cancel} variant="secondary" onClick={() => answer()}>
          {cancelText ?? t('cancelText')}
        </Button>
        <Button
          ref={confirm}
          variant={intent === 'danger' ? 'destructive' : 'primary'}
          onClick={() => answer(true)}
        >
          {okText ?? t('okText')}
        </Button>
      </div>
    </Surface>
  )
}

import type { ReactElement, ReactNode, ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { CloseIcon } from '../Icons'
import { IconButton } from './Button'
import { cn } from '../shadcn/utils'

/** Every surface has a visible title or an explicit accessible name. */
export type SurfaceName =
  | { title: Exclude<ReactNode, null | undefined | boolean>; label?: string }
  | { title?: never; label: string }

export function SurfaceCloseButton(
  props: Omit<ComponentProps<typeof IconButton>, 'label'>
) {
  const { t } = useTranslation()
  return (
    <IconButton
      {...props}
      label={t('close')}
      tooltip={false}
      variant="ghost"
      size="sm"
    >
      <CloseIcon />
    </IconButton>
  )
}

/** Internal layout, not a set of required slots for callers. */
export function SurfaceContent(props: {
  title?: ReactNode
  titleId: string
  close?: ReactElement
  children: ReactNode
  className?: string
}) {
  const { title, titleId, close, children, className } = props
  return (
    <>
      {(title != null || close) && (
        <div
          className={cn(
            'flex shrink-0 items-start gap-3 px-4 pt-3',
            title == null && 'justify-end'
          )}
        >
          {title != null && (
            <h2
              id={titleId}
              className="min-w-0 flex-1 py-1 text-ui-20 font-medium wrap-anywhere"
            >
              {title}
            </h2>
          )}
          {close}
        </div>
      )}
      <div
        className={cn(
          'min-h-0 overflow-y-auto overscroll-contain p-4',
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

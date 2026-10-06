import type { ReactElement, ReactNode, ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import type { SurfaceController } from '@/6-shared/overlays'
import { CloseIcon } from '../Icons'
import { useOverlayFinalFocus } from '../useOverlayFinalFocus'
import { IconButton } from './Button'
import { ScrollArea } from './ScrollArea'
import { cn } from '../shadcn/utils'

/** Every surface has a visible title or an explicit accessible name. */
export type SurfaceName =
  | { title: Exclude<ReactNode, null | undefined | boolean>; label?: string }
  | { title?: never; label: string }

/** A Base UI trigger already owns focus restoration. Hosted surfaces need
 * the focused opener captured before their content mounts and takes focus. */
export function useSurfaceFinalFocus<F>(props: {
  controller: SurfaceController
  trigger?: ReactElement
  finalFocus?: F
}) {
  const captured = useOverlayFinalFocus(props.controller.open, {
    fallback: true,
  })
  return props.finalFocus ?? (props.trigger ? undefined : captured)
}

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

/** Internal layout, not a set of required slots for callers. The body
 * scrolls in a ScrollArea that fills the rest of the surface; `className` is
 * the padding and layout of the content inside that scroll. */
export function SurfaceContent(props: {
  title?: ReactNode
  titleId: string
  close?: ReactElement
  children: ReactNode
  className?: string
  /** The children bring their own scroller, such as a virtual list. The body
   * is then a plain column they fill, with no padding and no scroll. */
  contentScrolls?: boolean
}) {
  const { title, titleId, close, children, className, contentScrolls } = props
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
      {contentScrolls ? (
        <div className={cn('flex min-h-0 flex-auto flex-col', className)}>
          {children}
        </div>
      ) : (
        <ScrollArea
          className="min-h-0 flex-auto"
          contentClassName={cn('p-4', className)}
        >
          {children}
        </ScrollArea>
      )}
    </>
  )
}

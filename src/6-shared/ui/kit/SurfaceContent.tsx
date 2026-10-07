import type { ReactElement, ReactNode, ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import type { SurfaceController } from '@/6-shared/overlays'
import { CloseIcon } from '../Icons'
import { useOverlayFinalFocus } from '../useOverlayFinalFocus'
import { IconButton } from './Button'
import { ScrollArea, type ScrollAreaProps } from './ScrollArea'
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
 * the padding and layout of the content inside that scroll. With
 * `contentScrolls` (see `DrawerProps`) the body is a plain column instead,
 * and `className` styles that column. */
export function SurfaceContent(props: {
  title?: ReactNode
  titleId: string
  close?: ReactElement
  children: ReactNode
  className?: string
  contentScrolls?: boolean
  /** Keep swipe dismissal off the body. A side drawer swipes across the way
   * its body scrolls, so a scroll that drifts sideways would close it; it is
   * dismissed from the header instead. */
  disableBodySwipe?: boolean
  /** How the body says it goes on: a thumb, or faded edges for popovers. */
  scroll?: Pick<ScrollAreaProps, 'scrollbar' | 'fade'>
}) {
  const {
    title,
    titleId,
    close,
    children,
    className,
    contentScrolls,
    scroll,
    disableBodySwipe,
  } = props
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
        <div
          data-base-ui-swipe-ignore={disableBodySwipe ? '' : undefined}
          className={cn('flex min-h-0 flex-auto flex-col', className)}
        >
          {children}
        </div>
      ) : (
        <ScrollArea
          data-base-ui-swipe-ignore={disableBodySwipe ? '' : undefined}
          className="flex-auto"
          contentClassName={cn('p-4', className)}
          {...scroll}
        >
          {children}
        </ScrollArea>
      )}
    </>
  )
}

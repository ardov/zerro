import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Drawer as Primitive } from '@base-ui/react/drawer'
import { useTranslation } from 'react-i18next'
import {
  useOverlayBack,
  type PopupController,
  type SurfaceController,
} from '@/6-shared/overlays'
import { MobileDrawerViewport } from '../MobileDrawerViewport'
import { modalBackdropClass } from './backdrop'
import { cn } from '@/6-shared/ui/shadcn/utils'
import {
  keepArrowKeys,
  SurfaceContent,
  SurfaceCloseButton,
  useSurfaceFinalFocus,
  type SurfaceName,
} from './SurfaceContent'
import { useOwnedPopup } from './useOwnedPopup'
import { useBottomSheetLayout } from './useBottomSheetLayout'
import './Surface.css'
import './Drawer.css'

export type DrawerProps = SurfaceName & {
  'aria-describedby'?: string
  /** Auto uses a bottom sheet below 500px and a right sheet at larger widths. Narrow side sheets fill the screen. */
  side?: 'auto' | 'bottom' | 'right' | 'left'
  className?: string
  style?: CSSProperties
  contentClassName?: string
  /** For a child-owned scrollport, give the drawer a definite height and no body padding.
   * The child's scroll content must consume --kit-scroll-bottom-inset; ScrollArea does so automatically. */
  contentScrolls?: boolean
  children: ReactNode
  onClose?: () => void
  onOpenChangeComplete?: (open: boolean) => void
  disabled?: boolean
  disablePointerDismissal?: boolean
  trigger?: ReactElement
  popup?: PopupController
}

export function Drawer(props: DrawerProps) {
  const { popup, onClose, ...restProps } = props
  const controller = useOwnedPopup({
    popup,
    onClose,
    unavailable: restProps.disabled,
  })
  return <DrawerSurface {...restProps} controller={controller} />
}

type DrawerSurfaceProps = Omit<DrawerProps, 'popup' | 'onClose'> & {
  controller: SurfaceController
  /** Covered surfaces retain content without creating another modal boundary. */
  active?: boolean
  id?: string
  finalFocus?: Primitive.Popup.Props['finalFocus']
  initialFocus?: Primitive.Popup.Props['initialFocus']
}

export function DrawerSurface(props: DrawerSurfaceProps) {
  return <DrawerFrame {...props} finalFocus={useSurfaceFinalFocus(props)} />
}

/** The narrow-screen form of an adaptive dialog or popover. Its owner has
 * already resolved final focus, and keeps it across a layout switch. */
export function BottomSheetSurface(props: Omit<DrawerSurfaceProps, 'side'>) {
  return (
    <DrawerFrame
      {...props}
      side="bottom"
      contentClassName={cn(
        !props.contentScrolls && 'p-4',
        props.contentClassName
      )}
    />
  )
}

function DrawerFrame(props: DrawerSurfaceProps) {
  const {
    label,
    id,
    'aria-describedby': descriptionId,
    title,
    initialFocus,
    children,
    trigger,
    controller,
    active = true,
    finalFocus,
    disabled,
    disablePointerDismissal,
    onOpenChangeComplete,
    side: requestedSide = 'auto',
    className,
    style,
    contentClassName,
    contentScrolls,
  } = props
  const { open, setOpen: onOpenChange } = controller
  const back = useOverlayBack()
  const popup = useRef<HTMLDivElement>(null)
  // A real close retains its opener; a covered owner must not restore focus.
  const wasActive = useRef(active)
  const [lastOpenActive, setLastOpenActive] = useState(active)
  if (open && lastOpenActive !== active) setLastOpenActive(active)
  // Covered roots sit below the active modal; a former active root keeps its
  // closing layer. The override must beat the shared custom z-modal utility.
  const covered = !active && (open || !lastOpenActive)
  useLayoutEffect(() => {
    if (
      active &&
      !wasActive.current &&
      open &&
      !popup.current?.contains(document.activeElement)
    )
      popup.current?.focus({ preventScroll: true })
    if (open) wasActive.current = active
  }, [active, open])
  const { t } = useTranslation()
  const titleId = useId()
  const bottomSheet = useBottomSheetLayout()
  const side =
    requestedSide === 'auto'
      ? bottomSheet
        ? 'bottom'
        : 'right'
      : requestedSide
  const page = side !== 'bottom' && bottomSheet
  return (
    <Primitive.Root
      open={open}
      modal={active}
      onOpenChange={(next, details) => {
        if (!next && details.reason === 'close-watcher' && back()) {
          // Android Back belongs to the whole stack. Prevent Base UI from
          // closing this drawer when the host dismissed a child instead.
          details.cancel()
          return
        }
        if (!active) {
          details.cancel()
          return
        }
        onOpenChange(next)
      }}
      disablePointerDismissal={disablePointerDismissal}
      onOpenChangeComplete={onOpenChangeComplete}
      swipeDirection={side === 'bottom' ? 'down' : side}
    >
      {trigger && <Primitive.Trigger disabled={disabled} render={trigger} />}
      <Primitive.Portal>
        <Primitive.Backdrop
          forceRender
          className={cn(
            'kit-drawer-backdrop',
            modalBackdropClass,
            covered && 'z-[calc(var(--z-index-modal)-1)]!'
          )}
        />
        <MobileDrawerViewport
          className={cn(
            'flex',
            covered && 'z-[calc(var(--z-index-modal)-1)]!',
            side === 'bottom' && 'items-end',
            side === 'right' && 'justify-end',
            side === 'left' && 'justify-start',
            side !== 'bottom' && !page && 'p-ui-drawer-inset'
          )}
        >
          <Primitive.Popup
            ref={popup}
            inert={!active || undefined}
            id={id}
            style={style}
            aria-label={label}
            aria-describedby={descriptionId}
            aria-labelledby={title != null ? titleId : undefined}
            initialFocus={active ? initialFocus : false}
            onKeyDown={keepArrowKeys}
            data-side={side}
            data-attached={side === 'bottom' || page ? '' : undefined}
            finalFocus={covered ? false : finalFocus}
            className={cn(
              'kit-modal-popup kit-drawer-popup pointer-events-auto relative flex flex-col rounded-smooth bg-ui-card text-ui-primary shadow-ui-popover outline-none',
              // Clip floating sheets at all corners. Attached sheets must paint beyond the viewport during a pull.
              side !== 'bottom' && !page && 'overflow-hidden',
              side === 'bottom'
                ? cn(
                    'rounded-t-ui-popover',
                    contentScrolls
                      ? 'h-[calc(100%-32px)]'
                      : 'max-h-[calc(100%-32px)]'
                  )
                : 'h-full w-90 max-w-full rounded-ui-popover',
              className,
              // Desktop popup widths must not shrink their mobile sheet.
              side === 'bottom' && 'w-full max-w-none',
              page &&
                'w-full max-w-none rounded-none pt-[env(safe-area-inset-top)]'
            )}
          >
            {side === 'bottom' && (
              <div
                aria-hidden
                className="flex h-6 shrink-0 items-center justify-center"
              >
                <span className="h-1 w-8 rounded-full bg-ui-border" />
              </div>
            )}
            <Primitive.Content
              // The scrollport reaches the edge; its last content reserves
              // the bottom spacing and safe area inside the scroll.
              className="flex min-h-0 flex-1 flex-col overflow-hidden [--kit-scroll-bottom-inset:max(8px,env(safe-area-inset-bottom))]"
            >
              <SurfaceContent
                disableBodySwipe={side !== 'bottom'}
                title={title}
                titleId={titleId}
                className={cn(
                  title == null && !contentScrolls && 'px-2 py-0',
                  contentClassName
                )}
                contentScrolls={contentScrolls}
                close={
                  side !== 'bottom' && title != null ? (
                    <Primitive.Close render={<SurfaceCloseButton />} />
                  ) : undefined
                }
              >
                {children}
              </SurfaceContent>
            </Primitive.Content>
            {(side === 'bottom' || title == null) && (
              <Primitive.Close className="sr-only">
                {t('close')}
              </Primitive.Close>
            )}
          </Primitive.Popup>
        </MobileDrawerViewport>
      </Primitive.Portal>
    </Primitive.Root>
  )
}

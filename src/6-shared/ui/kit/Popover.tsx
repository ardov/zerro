import { useId, type ReactElement, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover as Primitive } from '@base-ui/react/popover'
import type { PopupController, SurfaceController } from '@/6-shared/overlays'
import { cn } from '../shadcn/utils'
import { BottomSheetSurface } from './Drawer'
import {
  SurfaceContent,
  useSurfaceFinalFocus,
  type SurfaceName,
} from './SurfaceContent'
import { useOwnedPopup } from './useOwnedPopup'
import { useBottomSheetLayout } from './useBottomSheetLayout'
import { useListPanelPositioning } from './useListPanelPositioning'
import './Surface.css'

type PopoverOptions = SurfaceName & {
  children: ReactNode
  trigger?: ReactElement
  disabled?: boolean
  mobile?: 'drawer' | 'popover'
  anchor?: Primitive.Positioner.Props['anchor']
  side?: Primitive.Positioner.Props['side']
  align?: Primitive.Positioner.Props['align']
  sideOffset?: Primitive.Positioner.Props['sideOffset']
  alignOffset?: Primitive.Positioner.Props['alignOffset']
  collisionAvoidance?: Primitive.Positioner.Props['collisionAvoidance']
  className?: string
  contentClassName?: string
  initialFocus?: Primitive.Popup.Props['initialFocus']
  finalFocus?: Primitive.Popup.Props['finalFocus']
}
export type PopoverProps = PopoverOptions & {
  /** Register once in the owner; includes Back, never technical unmount. */
  onClose?: () => void
  popup?: PopupController
}
export type PopoverSurfaceProps = PopoverOptions & {
  controller: SurfaceController
}

export function Popover(props: PopoverProps) {
  const { popup, onClose, ...restProps } = props
  const controller = useOwnedPopup({
    popup,
    onClose,
    unavailable: props.disabled,
  })
  return <PopoverSurface {...restProps} controller={controller} />
}

export function PopoverSurface(props: PopoverSurfaceProps) {
  const {
    mobile = 'drawer',
    anchor,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionAvoidance,
    ...restProps
  } = props
  const narrow = useBottomSheetLayout()
  const finalFocus = useSurfaceFinalFocus(props)
  return narrow && mobile === 'drawer' ? (
    <BottomSheetSurface {...restProps} finalFocus={finalFocus} />
  ) : (
    <AnchoredPopover
      {...restProps}
      anchor={anchor}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      collisionAvoidance={collisionAvoidance}
      finalFocus={finalFocus}
    />
  )
}

function AnchoredPopover(props: PopoverSurfaceProps) {
  const {
    controller,
    trigger,
    disabled,
    title,
    label,
    children,
    anchor,
    side = 'bottom',
    align = 'start',
    sideOffset,
    alignOffset,
    collisionAvoidance = { side: 'flip', align: 'shift' },
    className,
    contentClassName,
    initialFocus,
    finalFocus,
  } = props
  const { open, setOpen: onOpenChange } = controller
  const { t } = useTranslation()
  const titleId = useId()
  const positioning = useListPanelPositioning()
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange} modal>
      {trigger && <Primitive.Trigger disabled={disabled} render={trigger} />}
      <Primitive.Portal>
        <Primitive.Backdrop className="fixed inset-0 z-modal" />
        <Primitive.Positioner
          {...positioning}
          anchor={anchor}
          side={side}
          align={align}
          sideOffset={sideOffset ?? positioning.sideOffset}
          alignOffset={alignOffset}
          collisionAvoidance={collisionAvoidance}
          className="z-modal"
        >
          <Primitive.Popup
            aria-label={label}
            aria-labelledby={title != null ? titleId : undefined}
            initialFocus={initialFocus}
            finalFocus={finalFocus}
            className={cn(
              'kit-surface-fade flex max-h-(--available-height) w-80 max-w-(--available-width) flex-col overflow-hidden rounded-ui-popover rounded-smooth bg-ui-popover text-ui-primary shadow-ui-popover outline-none',
              className
            )}
          >
            <SurfaceContent
              title={title}
              titleId={titleId}
              className={contentClassName}
            >
              {children}
            </SurfaceContent>
            {/* Base UI requires a Close part to trap focus in modal popovers.
                Keep an accessible dismissal without a visible close button. */}
            <Primitive.Close className="sr-only">{t('close')}</Primitive.Close>
          </Primitive.Popup>
        </Primitive.Positioner>
      </Primitive.Portal>
    </Primitive.Root>
  )
}

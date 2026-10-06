import {
  useRef,
  type ReactElement,
  type ReactNode,
  type RefObject,
  type ComponentProps,
} from 'react'
import { Menu as Primitive } from '@base-ui/react/menu'
import { ContextMenu as ContextPrimitive } from '@base-ui/react/context-menu'
import { Checkbox } from '@base-ui/react/checkbox'
import { Link } from 'react-router-dom'
import type { PopupController, SurfaceController } from '@/6-shared/overlays'
import { DrawerSurface } from './Drawer'
import { useSurfaceFinalFocus } from './SurfaceContent'
import { ScrollArea } from './ScrollArea'
import { ListRow, ListRowHeader, ListRowSeparator } from './ListRow'
import { useListPanelPositioning } from './useListPanelPositioning'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { useOwnedPopup } from './useOwnedPopup'
import { useBottomSheetLayout } from './useBottomSheetLayout'
import './Menu.css'
import './Surface.css'

type ItemContent = {
  id: string
  label: string
  description?: string
  start?: ReactNode
  disabled?: boolean
}
export type MenuItem =
  | (ItemContent & {
      type?: 'action'
      onSelect: () => void
      destructive?: boolean
    })
  | (ItemContent & {
      type: 'checkbox'
      checked: boolean
      onCheckedChange: (checked: boolean) => void
    })
  /** Navigates within the app. Leaving the entry dismisses the menu, so the
   * link never closes it: that would be a Back step racing the push. */
  | (Omit<ItemContent, 'disabled'> & { type: 'link'; to: string })
  | { id: string; type: 'separator' }
  | { id: string; type: 'group'; label: string; items: readonly MenuItem[] }

export type MenuProps = {
  label: string
  trigger: ReactElement
  items: readonly MenuItem[]
  popup?: PopupController
  mobile?: 'drawer' | 'popover'
  disabled?: boolean
}

export function Menu(props: MenuProps) {
  return <AdaptiveMenu {...props} />
}

/** The trigger is a context area; provide a visible Menu for the same actions too. */
export function ContextMenu(props: MenuProps) {
  return <AdaptiveMenu {...props} context />
}

function AdaptiveMenu(props: MenuProps & { context?: boolean }) {
  const {
    label,
    trigger,
    items,
    popup,
    disabled = false,
    context = false,
    mobile: mobileMode = 'drawer',
  } = props
  const controller = useOwnedPopup({ popup, unavailable: disabled })
  const { open, setOpen } = controller
  const narrow = useBottomSheetLayout()
  const mobile = narrow && mobileMode === 'drawer'
  const sourceRef = useRef<HTMLElement | null>(null)
  const content = (
    <MenuItems items={items} mobile={mobile} close={() => setOpen(false)} />
  )
  const finalFocus = () => sourceRef.current ?? true
  const desktop = (
    <MenuPopup
      label={label}
      // A regular trigger already supplies Base UI's return target. An
      // explicit target would steal focus moved elsewhere during exit.
      finalFocus={context ? finalFocus : undefined}
    >
      {content}
    </MenuPopup>
  )
  const sheet = (
    <DrawerSurface
      label={label}
      side="bottom"
      disabled={disabled}
      controller={controller}
      trigger={!context ? trigger : undefined}
      finalFocus={finalFocus}
    >
      {content}
    </DrawerSurface>
  )
  if (context) {
    return (
      <>
        <ContextMenuTrigger
          open={open}
          mobile={mobile}
          disabled={disabled}
          onOpenChange={setOpen}
          sourceRef={sourceRef}
          trigger={trigger}
        >
          {!mobile && desktop}
        </ContextMenuTrigger>
        {mobile && sheet}
      </>
    )
  }
  if (mobile) return sheet
  return (
    <Primitive.Root
      loopFocus={false}
      open={open}
      disabled={disabled}
      onOpenChange={setOpen}
    >
      <Primitive.Trigger
        ref={(node: HTMLElement | null) => {
          sourceRef.current = node
        }}
        render={trigger}
      />
      {desktop}
    </Primitive.Root>
  )
}

export type MenuSurfaceProps = {
  label: string
  controller: SurfaceController
  items: readonly MenuItem[]
  anchor: Primitive.Positioner.Props['anchor']
}

/** A menu opened by an existing overlay owner, such as an asked context menu.
 * Items behave as in Menu: selecting one closes the surface, then runs it. */
export function MenuSurface(props: MenuSurfaceProps) {
  const { label, controller, items, anchor } = props
  const mobile = useBottomSheetLayout()
  const finalFocus =
    useSurfaceFinalFocus<Primitive.Popup.Props['finalFocus']>(props)
  const content = (
    <MenuItems
      items={items}
      mobile={mobile}
      close={() => controller.setOpen(false)}
    />
  )
  return mobile ? (
    <DrawerSurface
      label={label}
      side="bottom"
      controller={controller}
      finalFocus={finalFocus}
    >
      {content}
    </DrawerSurface>
  ) : (
    <Primitive.Root
      loopFocus={false}
      open={controller.open}
      onOpenChange={controller.setOpen}
    >
      <MenuPopup label={label} anchor={anchor} finalFocus={finalFocus}>
        {content}
      </MenuPopup>
    </Primitive.Root>
  )
}

function MenuPopup(props: {
  label: string
  children: ReactNode
  anchor?: Primitive.Positioner.Props['anchor']
  finalFocus?: Primitive.Popup.Props['finalFocus']
}) {
  const { label, children, anchor, finalFocus } = props
  const positioning = useListPanelPositioning()
  return (
    <Primitive.Portal>
      <Primitive.Positioner
        {...positioning}
        anchor={anchor}
        className="z-popover"
      >
        <Primitive.Popup
          aria-label={label}
          aria-labelledby={undefined}
          finalFocus={finalFocus}
          className={cn(
            'kit-surface-fade flex flex-col overflow-hidden outline-none',
            'max-h-(--available-height) max-w-(--available-width) min-w-[min(13rem,var(--available-width))]',
            'rounded-ui-popover rounded-smooth bg-ui-popover text-ui-primary shadow-ui-popover'
          )}
        >
          <ScrollArea contentClassName="p-1" scrollbar="none" fade>
            {children}
          </ScrollArea>
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  )
}

/** Keep gesture recognition and its follow-up click suppression together. */
function ContextMenuTrigger(props: {
  open: boolean
  mobile: boolean
  disabled: boolean
  onOpenChange: (open: boolean) => void
  sourceRef: RefObject<HTMLElement | null>
  trigger: ReactElement
  children: ReactNode
}) {
  const { open, mobile, disabled, onOpenChange, sourceRef, trigger, children } =
    props
  const suppressClick = useRef(false)
  return (
    <ContextPrimitive.Root
      loopFocus={false}
      open={mobile ? false : open}
      disabled={disabled}
      onOpenChange={(next, details) => {
        // The mobile trigger only recognizes the gesture. Drawer owns modality.
        if (mobile) details.cancel()
        if (next && !open && details.event.type.startsWith('touch')) {
          suppressClick.current = true
          navigator.vibrate?.(10)
        }
        onOpenChange(next)
      }}
    >
      <ContextPrimitive.Trigger
        tabIndex={0}
        className="kit-context-trigger"
        onContextMenu={event => {
          if (nativeContextTarget(event.target)) {
            event.preventBaseUIHandler()
            event.stopPropagation()
          }
        }}
        onTouchStart={event => {
          if (nativeContextTarget(event.target)) {
            event.preventBaseUIHandler()
            event.stopPropagation()
          }
        }}
        onPointerDownCapture={() => {
          suppressClick.current = false
        }}
        onClickCapture={event => {
          if (suppressClick.current) {
            suppressClick.current = false
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        onKeyDown={event => {
          if (nativeContextTarget(event.target)) return
          if (
            event.key === 'ContextMenu' ||
            (event.shiftKey && event.key === 'F10')
          ) {
            event.preventDefault()
            // Base UI's context trigger handles gestures but no keyboard shortcut.
            // Reuse its contextmenu path so it owns the virtual anchor as well.
            const target =
              event.target instanceof HTMLElement
                ? event.target
                : event.currentTarget
            const bounds = target.getBoundingClientRect()
            event.currentTarget.dispatchEvent(
              new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: bounds.left,
                clientY: bounds.bottom,
              })
            )
          }
        }}
        ref={(node: HTMLElement | null) => {
          sourceRef.current = node
        }}
        render={trigger}
      />
      {children}
    </ContextPrimitive.Root>
  )
}

function MenuItems(props: {
  items: readonly MenuItem[]
  mobile: boolean
  close: () => void
}) {
  const { items, mobile, close } = props
  const select = (action: () => void) => {
    close()
    action()
  }
  return items.map(item => {
    if (item.type === 'separator') return <ListRowSeparator key={item.id} />
    if (item.type === 'group')
      return (
        <div key={item.id} role="group" aria-label={item.label}>
          <ListRowHeader size={mobile ? 'lg' : 'sm'}>
            {item.label}
          </ListRowHeader>
          <MenuItems items={item.items} mobile={mobile} close={close} />
        </div>
      )
    const row = <MenuRow item={item} mobile={mobile} />
    if (item.type === 'link') {
      return mobile ? (
        <MenuRow
          key={item.id}
          item={item}
          mobile
          render={<Link to={item.to} />}
        >
          {item.label}
        </MenuRow>
      ) : (
        <Primitive.LinkItem
          key={item.id}
          render={
            <MenuRow
              item={item}
              mobile={false}
              render={<Link to={item.to} />}
            />
          }
        >
          {item.label}
        </Primitive.LinkItem>
      )
    }
    if (item.type === 'checkbox') {
      return mobile ? (
        <Checkbox.Root
          key={item.id}
          checked={item.checked}
          onCheckedChange={item.onCheckedChange}
          disabled={item.disabled}
          render={row}
        >
          {item.label}
        </Checkbox.Root>
      ) : (
        <Primitive.CheckboxItem
          key={item.id}
          checked={item.checked}
          onCheckedChange={item.onCheckedChange}
          disabled={item.disabled}
          render={row}
        >
          {item.label}
        </Primitive.CheckboxItem>
      )
    }
    return mobile ? (
      <MenuRow
        key={item.id}
        item={item}
        mobile
        render={
          <button
            type="button"
            disabled={item.disabled}
            onClick={() => select(item.onSelect)}
          />
        }
      >
        {item.label}
      </MenuRow>
    ) : (
      <Primitive.Item
        key={item.id}
        disabled={item.disabled}
        closeOnClick={false}
        onClick={() => select(item.onSelect)}
        render={row}
      >
        {item.label}
      </Primitive.Item>
    )
  })
}

function MenuRow(
  props: Omit<ComponentProps<typeof ListRow>, 'start'> & {
    item: Exclude<MenuItem, { type: 'group' | 'separator' }>
    mobile: boolean
  }
) {
  const { item, mobile, className, ...restProps } = props
  return (
    <ListRow
      {...restProps}
      size={mobile ? 'lg' : 'sm'}
      start={item.start}
      description={item.description}
      className={cn(
        mobile && [
          'cursor-pointer focusable',
          'hover:[&:not(:disabled):not([aria-disabled=true]):not([data-disabled])]:after:opacity-100',
        ],
        item.type !== 'checkbox' &&
          item.type !== 'link' &&
          item.destructive &&
          'text-ui-error',
        className
      )}
      end={
        item.type === 'checkbox' ? (
          <span
            aria-hidden
            className={cn(
              'flex h-5 w-8 items-center rounded-full p-0.5',
              item.checked ? 'bg-ui-button-primary' : 'bg-ui-border'
            )}
          >
            <span
              className={cn(
                'size-4 rounded-full bg-ui-popover',
                item.checked && 'translate-x-3'
              )}
            />
          </span>
        ) : undefined
      }
    />
  )
}

function nativeContextTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'a, input, textarea, select, [contenteditable]:not([contenteditable="false"])'
      )
    )
  )
}

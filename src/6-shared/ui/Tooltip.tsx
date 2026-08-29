import { useEffect, useId, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { cn } from './shadcn/utils'

/** legacy UI's `enterDelay`. It is declared on every trigger as well as on the
 * shared provider, so a tooltip rendered outside the provider — a unit test,
 * an isolated render — opens on the same schedule. */
const OPEN_DELAY = 300

/** One provider for the whole app, mounted in `1-app/Providers`.
 *
 * Base UI groups the tooltips under a single provider: moving from one trigger
 * to the next inside the group's window opens the second instantly instead of
 * waiting out the delay again, which is what makes a row of icon buttons read
 * as one thing rather than as five that each have to be earned. legacy UI had no
 * grouping and made every tooltip wait; this is deliberately not that. */
export function TooltipProvider(props: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delay={OPEN_DELAY}>
      {props.children}
    </TooltipPrimitive.Provider>
  )
}

export type TooltipProps = {
  /** Nothing is rendered without one, so a call site can pass a value that
   * may be empty and not branch around it. */
  title?: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  arrow?: boolean
  /** legacy UI's opt-out of a tooltip the pointer can move into. */
  disableInteractive?: boolean
  className?: string
  children: ReactElement
}

/** legacy UI's `Tooltip`: a dark label that appears 300ms after the pointer settles
 * on its child, 14px clear of it, under it unless asked otherwise.
 *
 * The type is the app's own 14px rather than legacy UI's 11px — that override was
 * the reason this file wrapped legacy UI in the first place, and it is now simply
 * what the class says. */
export function Tooltip({
  title,
  placement = 'bottom',
  arrow,
  disableInteractive,
  className,
  children,
}: TooltipProps) {
  if (!title) return children
  return (
    <ActiveTooltip
      title={title}
      placement={placement}
      arrow={arrow}
      disableInteractive={disableInteractive}
      className={className}
    >
      {children}
    </ActiveTooltip>
  )
}

function ActiveTooltip({
  title,
  placement,
  arrow,
  disableInteractive,
  className,
  children,
}: TooltipProps & { title: ReactNode }) {
  const [open, setOpen] = useState(false)
  const triggerId = useId()
  const touchOpenTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const touchCloseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  const clearTouchOpen = () => clearTimeout(touchOpenTimer.current)
  const clearTouchClose = () => clearTimeout(touchCloseTimer.current)

  useEffect(
    () => () => {
      clearTimeout(touchOpenTimer.current)
      clearTimeout(touchCloseTimer.current)
    },
    []
  )

  const handleTouchStart = () => {
    clearTouchOpen()
    clearTouchClose()
    touchOpenTimer.current = setTimeout(() => setOpen(true), 700)
  }

  const handleTouchEnd = () => {
    clearTouchOpen()
    clearTouchClose()
    touchCloseTimer.current = setTimeout(() => setOpen(false), 1500)
  }

  return (
    <TooltipPrimitive.Root
      open={open}
      onOpenChange={nextOpen => setOpen(nextOpen)}
      triggerId={triggerId}
      disableHoverablePopup={disableInteractive}
    >
      <TooltipPrimitive.Trigger
        // legacy UI named its child rather than describing it: a string title
        // became the child's `aria-label`, which is the only accessible
        // name every icon-only button in this app has. Base UI describes
        // instead, and describing an unnamed button leaves it unnamed.
        id={triggerId}
        // The provider carries this too. Declaring it here as well keeps a
        // tooltip outside the provider on the same schedule; it does not cost
        // the grouping, because a trigger inside the group's instant window
        // opens at zero whatever its own delay says.
        delay={OPEN_DELAY}
        aria-label={typeof title === 'string' ? title : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        render={children}
      />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          side={placement}
          sideOffset={14}
          collisionPadding={2}
          positionMethod="fixed"
          className="z-tooltip"
        >
          <TooltipPrimitive.Popup
            data-slot="tooltip"
            className={cn(
              // 14px at the theme's own line height. The size is this app's override of
              // legacy UI's 11px, and it was the only reason this file used to wrap legacy UI.
              'max-w-[300px] rounded-lg bg-tooltip px-2 py-1 text-center font-sans text-sm/[1.5] font-medium break-words text-tooltip-foreground',
              className
            )}
          >
            {arrow && (
              <TooltipPrimitive.Arrow className="text-tooltip">
                <ArrowShape />
              </TooltipPrimitive.Arrow>
            )}
            {title}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

/** legacy UI's arrow is a square rotated 45° and half-hidden behind the tooltip,
 * which is why it is 1em across and 0.71em tall. */
function ArrowShape() {
  return (
    <span className="block h-[0.71em] w-[1em] overflow-hidden">
      <span className="block h-full w-full origin-top-left rotate-45 bg-current" />
    </span>
  )
}

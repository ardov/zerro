import type { ReactElement, ReactNode } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { cn } from '@/6-shared/ui/shadcn/utils'

export type TooltipProviderProps = {
  children: ReactNode
  delay?: number
  timeout?: number
}

/** Mount once around the kit to share the initial delay and instant-open window. */
export function TooltipProvider({
  children,
  delay = 300,
  timeout = 400,
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider delay={delay} timeout={timeout}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

export type TooltipProps = {
  content?: ReactNode
  /** Must forward DOM props and ref. The control owns its accessible name. */
  children: ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  disabled?: boolean
  /** Applied to the popup. */
  className?: string
}

export function Tooltip({
  content,
  children,
  side = 'bottom',
  align = 'center',
  disabled = false,
  className,
}: TooltipProps) {
  const empty =
    content == null || typeof content === 'boolean' || content === ''

  return (
    <TooltipPrimitive.Root disabled={disabled || empty}>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={8}
          positionMethod="fixed"
          className="z-tooltip"
        >
          <TooltipPrimitive.Popup
            className={cn(
              'max-w-[min(300px,var(--available-width))] rounded-ui-control-inner rounded-smooth bg-ui-tooltip px-3 py-1.5 font-sans text-ui-14 text-balance break-words text-ui-on-tooltip',
              'transition-[opacity,translate] duration-120 ease-out data-ending-style:opacity-0 data-ending-style:duration-80 data-starting-style:opacity-0',
              'motion-safe:data-starting-style:data-[side=top]:translate-y-1',
              'motion-safe:data-starting-style:data-[side=bottom]:-translate-y-1',
              'motion-safe:data-starting-style:data-[side=left]:translate-x-1',
              'motion-safe:data-starting-style:data-[side=right]:-translate-x-1',
              'data-instant:transition-none',
              className
            )}
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

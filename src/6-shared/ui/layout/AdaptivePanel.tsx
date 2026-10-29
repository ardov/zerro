import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { DrawerSurface } from '@/6-shared/ui/kit/Drawer'
import { ScrollArea } from '@/6-shared/ui/kit/ScrollArea'
import type { SurfaceName } from '@/6-shared/ui/kit/SurfaceContent'
import type { SurfaceController } from '@/6-shared/overlays'
import { cn } from '@/6-shared/ui/shadcn/utils'
import './layout.css'

/** One editor and one scrollport, with two possible homes. Moving their stable
 * host preserves React state and native input/scroll state across a resize.
 * Changing a portal's target instead would remount the editor. */
export function AdaptivePanel({
  docked,
  controller,
  children,
  contentClassName,
  className,
  finalFocus,
  ...name
}: SurfaceName & {
  docked: boolean
  controller: SurfaceController
  children: ReactNode
  contentClassName?: string
  /** Styles the docked home; the drawer keeps its standard geometry. */
  className?: string
  finalFocus?: ComponentProps<typeof DrawerSurface>['finalFocus']
}) {
  const [host] = useState(() => {
    const element = document.createElement('div')
    element.className = 'flex min-h-0 min-w-0 flex-1 flex-col'
    return element
  })
  const [drawerMounted, setDrawerMounted] = useState(false)
  const viewport = useRef<HTMLDivElement | null>(null)
  const scrollTop = useRef(0)
  const focusedField = useRef<HTMLElement | null>(null)
  const moving = useRef(false)
  const restoreFrame = useRef<number | undefined>(undefined)
  const restoreScroll = useCallback(() => {
    if (viewport.current) viewport.current.scrollTop = scrollTop.current
  }, [])
  const attach = useCallback(
    (target: HTMLElement | null) => {
      if (!target || host.parentNode === target) return
      moving.current = true
      const focused = host.contains(document.activeElement)
        ? (document.activeElement as HTMLElement)
        : null
      // State-preserving DOM moves keep focus as well as scroll. Older engines
      // need focus restored after reparenting; the React subtree still survives.
      if (
        typeof target.moveBefore === 'function' &&
        host.isConnected &&
        target.isConnected
      ) {
        target.moveBefore(host, null)
      } else {
        target.appendChild(host)
        focused?.focus({ preventScroll: true })
      }
      restoreScroll()
      // The drawer's focus manager and the new viewport height settle during
      // this commit. Neither should replace the user's remembered scroll.
      cancelAnimationFrame(restoreFrame.current ?? 0)
      restoreFrame.current = requestAnimationFrame(() => {
        restoreScroll()
        moving.current = false
      })
    },
    [host, restoreScroll]
  )
  const inlineRef = useCallback(
    (node: HTMLElement | null) => {
      if (docked) attach(node)
    },
    [attach, docked]
  )
  const drawerRef = useCallback(
    (node: HTMLDivElement | null) => {
      setDrawerMounted(!!node)
      if (!docked) attach(node)
    },
    [attach, docked]
  )
  useLayoutEffect(
    () => () => cancelAnimationFrame(restoreFrame.current ?? 0),
    []
  )
  // Content that a closed drawer has unmounted does not come back: the next
  // opening is new content and starts at the top.
  const contentMounted = docked || controller.open || drawerMounted
  useLayoutEffect(() => {
    if (!contentMounted) scrollTop.current = 0
  }, [contentMounted])

  return (
    <>
      <section
        ref={inlineRef}
        hidden={!docked}
        aria-label={name.label}
        className={cn(
          'layout-panel flex rounded-smooth overflow-hidden',
          className
        )}
      />
      <DrawerSurface
        {...name}
        controller={{
          open: !docked && controller.open,
          setOpen: controller.setOpen,
        }}
        finalFocus={docked ? false : finalFocus}
        initialFocus={() => {
          const field = focusedField.current
          if (!field || !host.contains(field)) return true
          field.focus({ preventScroll: true })
          restoreScroll()
          return false
        }}
        contentScrolls
        contentClassName="p-0"
      >
        <div ref={drawerRef} className="flex min-h-0 min-w-0 flex-1" />
      </DrawerSurface>
      {contentMounted &&
        createPortal(
          <ScrollArea
            viewportRef={viewport}
            className="flex-1"
            contentClassName={contentClassName}
            onFocusCapture={event => {
              focusedField.current = event.target as HTMLElement
            }}
            onBlurCapture={event => {
              if (
                event.relatedTarget &&
                !host.contains(event.relatedTarget as Node)
              )
                focusedField.current = null
            }}
            onScrollCapture={event => {
              if (!moving.current && event.target === viewport.current)
                scrollTop.current = viewport.current.scrollTop
            }}
          >
            {children}
          </ScrollArea>,
          host
        )}
    </>
  )
}

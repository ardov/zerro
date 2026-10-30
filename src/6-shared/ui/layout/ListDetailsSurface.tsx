import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type { SurfaceController } from '@/6-shared/overlays'
import { useMediaQueryValue } from '@/6-shared/hooks/useMediaQueryValue'
import { DrawerSurface } from '@/6-shared/ui/kit/Drawer'
import { SurfaceCloseButton } from '@/6-shared/ui/kit/SurfaceContent'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { useOverlayFinalFocus } from '@/6-shared/ui/useOverlayFinalFocus'
import { AdaptivePanel } from './AdaptivePanel'
import './ListDetailsSurface.css'

const LIST_WIDTH = 400

function usePairedDetailsLayout(detailsWidth: number) {
  // Media queries cannot resolve CSS variables. Read the shared pixel tokens
  // once per surface; geometry and the fit threshold then use the same values.
  const [spacing] = useState(() => {
    const style = getComputedStyle(document.documentElement)
    return {
      gap: parseFloat(style.getPropertyValue('--spacing-ui-panel-gap')),
      inset: parseFloat(style.getPropertyValue('--spacing-ui-drawer-inset')),
    }
  })
  return useMediaQueryValue(
    `(min-width: ${LIST_WIDTH + detailsWidth + spacing.gap + 2 * spacing.inset}px)`
  )
}

export type ListDetailsSurfaceProps = {
  title: string
  active?: boolean
  controller: SurfaceController
  children: ReactNode
  onOpenChangeComplete?: (open: boolean) => void
  details: {
    label: string
    controller: SurfaceController
    children: ReactNode
    width?: number
  }
}

/** The owner supplies navigation. This surface presents its list and one
 * Details view in one modal region when they fit, or nested when they do not. */
export function ListDetailsSurface({
  title,
  active = true,
  controller,
  children,
  details,
  onOpenChangeComplete,
}: ListDetailsSurfaceProps) {
  const width = details.width ?? 360
  const wide = usePairedDetailsLayout(width)
  const detailsOpen = details.controller.open
  // Keep the docked host until its exit finishes; moving it into a closed
  // drawer would remove the editor before it can slide out.
  const [presence, setPresence] = useState({
    open: detailsOpen,
    exiting: false,
  })
  if (presence.open !== detailsOpen)
    setPresence({ open: detailsOpen, exiting: !detailsOpen })
  const exiting = presence.exiting && !detailsOpen
  const paired = wide && (detailsOpen || exiting)
  const detailsPanel = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const listFocus = useRef<HTMLElement | null>(null)
  const previousOpen = useRef(false)
  const restoreFocus = useOverlayFinalFocus(detailsOpen, {
    fallback: true,
    target: () => listFocus.current,
  })

  useLayoutEffect(() => {
    if (!exiting) return
    let cancelled = false
    const animations = detailsPanel.current?.getAnimations() ?? []
    void Promise.allSettled(
      animations.map(animation => animation.finished)
    ).then(() => {
      if (!cancelled) setPresence({ open: false, exiting: false })
    })
    return () => {
      cancelled = true
    }
  }, [exiting, wide])

  useLayoutEffect(() => {
    const opening = detailsOpen && !previousOpen.current
    const closing = !detailsOpen && previousOpen.current
    previousOpen.current = detailsOpen
    if (opening && wide) content.current?.focus({ preventScroll: true })
    if (closing && wide && controller.open) {
      const target = restoreFocus('')
      if (target instanceof HTMLElement) target.focus({ preventScroll: true })
    }
  }, [detailsOpen, wide, controller.open, restoreFocus])

  return (
    <DrawerSurface
      active={active && (wide || !detailsOpen)}
      label={title}
      onOpenChangeComplete={onOpenChangeComplete}
      controller={{
        open: controller.open,
        setOpen: next => {
          if (next) return
          if (detailsOpen) details.controller.setOpen(false)
          else controller.setOpen(false)
        },
      }}
      className={cn(
        'w-(--list-width)',
        wide &&
          'list-details-surface overflow-visible bg-transparent shadow-none'
      )}
      style={
        {
          '--list-width': `${LIST_WIDTH}px`,
          '--details-width': `${width}px`,
          width: paired
            ? 'calc(var(--list-width) + var(--details-width) + var(--spacing-ui-panel-gap))'
            : undefined,
        } as CSSProperties
      }
      contentScrolls
      bottomInsetOwner="content"
      contentClassName="p-0"
    >
      <div
        className="list-details-content flex min-h-0 flex-1"
        data-details-open={detailsOpen || undefined}
      >
        <section
          aria-label={title}
          onFocusCapture={event => {
            listFocus.current = event.target as HTMLElement
          }}
          className="list-details-list layout-panel rounded-smooth flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          <header className="flex shrink-0 items-start gap-3 px-4 pt-3">
            <h2 className="min-w-0 flex-1 py-1 text-ui-20 font-medium wrap-anywhere">
              {title}
            </h2>
            <SurfaceCloseButton onClick={() => controller.setOpen(false)} />
          </header>
          {children}
        </section>
        <div
          ref={detailsPanel}
          className="list-details-detail flex min-h-0 min-w-0"
          hidden={!paired}
          inert={wide && !detailsOpen}
          aria-hidden={(wide && !detailsOpen) || undefined}
        >
          <AdaptivePanel
            active={active}
            docked={paired}
            controller={details.controller}
            label={details.label}
            finalFocus={restoreFocus}
            className="min-w-0 flex-1"
            contentClassName="flex min-h-full flex-col p-0"
          >
            <div
              ref={content}
              tabIndex={-1}
              className="flex min-h-full flex-1 flex-col outline-none"
            >
              {details.children}
            </div>
          </AdaptivePanel>
        </div>
      </div>
    </DrawerSurface>
  )
}

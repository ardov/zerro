import { useLayoutEffect, useRef, type ReactNode } from 'react'
import type { SurfaceController } from '@/6-shared/overlays'
import { useMediaQueryValue } from '@/6-shared/hooks/useMediaQueryValue'
import { DrawerSurface } from '@/6-shared/ui/kit/Drawer'
import { SurfaceCloseButton } from '@/6-shared/ui/kit/SurfaceContent'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { useOverlayFinalFocus } from '@/6-shared/ui/useOverlayFinalFocus'
import { AdaptivePanel } from './AdaptivePanel'

const LIST_WIDTH = 400
const GAP = 8
const OUTER_INSETS = 8

function usePairedDetailsLayout(detailsWidth: number) {
  return useMediaQueryValue(
    `(min-width: ${LIST_WIDTH + detailsWidth + GAP + OUTER_INSETS}px)`
  )
}

export type ListDetailsSurfaceProps = {
  title: string
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
  controller,
  children,
  details,
  onOpenChangeComplete,
}: ListDetailsSurfaceProps) {
  const width = details.width ?? 360
  const wide = usePairedDetailsLayout(width)
  const detailsOpen = details.controller.open
  const paired = wide && detailsOpen
  const content = useRef<HTMLDivElement>(null)
  const listFocus = useRef<HTMLElement | null>(null)
  const previousOpen = useRef(false)
  const restoreFocus = useOverlayFinalFocus(detailsOpen, {
    fallback: true,
    target: () => listFocus.current,
  })

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
      className="w-100"
      style={paired ? { width: LIST_WIDTH + width + GAP } : undefined}
      contentScrolls
      contentClassName="p-0"
    >
      <div className={cn('flex min-h-0 flex-1', paired && 'gap-2')}>
        <section
          aria-label={title}
          onFocusCapture={event => {
            listFocus.current = event.target as HTMLElement
          }}
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col',
            paired && 'w-100 flex-none'
          )}
        >
          <header className="flex shrink-0 items-start gap-3 px-4 pt-3">
            <h2 className="min-w-0 flex-1 py-1 text-ui-20 font-medium wrap-anywhere">
              {title}
            </h2>
            <SurfaceCloseButton onClick={() => controller.setOpen(false)} />
          </header>
          {children}
        </section>
        <AdaptivePanel
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
    </DrawerSurface>
  )
}

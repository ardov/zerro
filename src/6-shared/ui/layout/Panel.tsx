import type { CSSProperties, ReactNode } from 'react'
import { ScrollArea } from '@/6-shared/ui/kit/ScrollArea'
import { cn } from '@/6-shared/ui/shadcn/utils'

/** How much of the window the phone's bottom bar covers. The layout sets
 * `--bottom-inset` on the canvas from the bar's measured height, so it
 * reaches every page scroller and none of the overlays, which the bar does
 * not cover. */
export const bottomBarInset = 'var(--bottom-inset, 0px)'

/** The same room for a page scroller that is not a ScrollArea, such as a
 * virtual list: inside the scroll, so content passes under the bar instead
 * of stopping above it. */
export const scrollInsetClass = 'pb-(--bottom-inset) scroll-pb-(--bottom-inset)'

type PanelProps = {
  children?: ReactNode
  /** The panel's size in the canvas: its width, whether it grows. */
  className?: string
  style?: CSSProperties
  /** Padding and layout of the content, inside the scroll. */
  contentClassName?: string
  /** The content brings its own scroller (a virtual list, say). The panel
   * then only clips it to the rounded corners, and that scroller takes
   * `scrollInsetClass`. */
  contentScrolls?: boolean
}

/** One rounded region of the canvas that scrolls on its own. The caller sets
 * its width; on a phone it runs edge to edge.
 *
 * The panel is a ScrollArea, so its edge is where content scrolls out of
 * sight, and it leaves room at the end for the bottom bar. */
export function Panel(props: PanelProps) {
  const { children, className, style, contentClassName, contentScrolls } = props
  const surface = cn(
    'min-h-0 bg-ui-card text-ui-primary sm:rounded-ui-card rounded-smooth',
    className
  )
  if (contentScrolls)
    return (
      <section className={cn(surface, 'overflow-hidden')} style={style}>
        {children}
      </section>
    )
  return (
    <ScrollArea
      className={surface}
      style={style}
      contentClassName={contentClassName}
      bottomInset={bottomBarInset}
    >
      {children}
    </ScrollArea>
  )
}

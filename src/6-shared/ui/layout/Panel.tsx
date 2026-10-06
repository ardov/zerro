import type { ComponentProps } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'

/** What every scrolling surface of the canvas carries: room at the end of its
 * content for whatever overlaps the bottom of the window (the phone's bottom
 * bar), inside the scroll so content passes under the overlap instead of
 * stopping above it. */
export const scrollInsetClass = 'pb-(--bottom-inset) scroll-pb-(--bottom-inset)'

type PanelProps = ComponentProps<'section'> & {
  /** The content brings its own scroller (a virtual list, say). The panel
   * then only clips it to the rounded corners, and that scroller takes
   * `scrollInsetClass`. */
  contentScrolls?: boolean
}

/** One rounded region of the canvas that scrolls on its own. The caller sets
 * its width; on a phone it runs edge to edge.
 *
 * The panel is the scroller, so its edge is where content scrolls out of
 * sight. It takes no padding: padding belongs to the content inside, where it
 * scrolls along — padding here would inset sticky headers and every row. */
export function Panel({ className, contentScrolls, ...props }: PanelProps) {
  return (
    <section
      className={cn(
        'min-h-0 bg-card text-card-foreground sm:rounded-lg',
        contentScrolls
          ? 'overflow-hidden'
          : ['overflow-auto', scrollInsetClass],
        className
      )}
      {...props}
    />
  )
}

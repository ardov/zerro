import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import './ScrollArea.css'
import './edgeFade.css'

export type ScrollAreaProps = Omit<
  ScrollAreaPrimitive.Root.Props,
  'className' | 'children' | 'render' | 'style'
> & {
  children?: ReactNode
  style?: CSSProperties
  /** The surface itself: its size, background and radius. The viewport fills
   * it edge to edge, so content scrolls out of sight at the surface's edge. */
  className?: string
  /** Padding goes here, inside the scroll. Keep side padding off it when the
   * content has sticky headers and put it on the rows: a sticky element
   * cannot leave its parent's content box. */
  contentClassName?: string
  /** `overlay` shows a thin thumb while the area is hovered or scrolled.
   * `none` is for small popups, where `fade` says the list goes on. */
  scrollbar?: 'overlay' | 'none'
  /** Fades the content at an edge with more past it. The fade is a mask over
   * everything that scrolls, so a sticky header inside the area fades with
   * the rows: put a header above the area, in the surface, instead. */
  fade?: boolean
  /** Room at the end for something that covers the bottom of the area, such
   * as the phone's bottom bar; a CSS length. It goes inside the scroll and
   * into the scroll padding, and lifts the thumb's track, so the last row and
   * the thumb stop above the cover while content still passes under it.
   * Areas nested in the content do not inherit it. */
  bottomInset?: string
}

/** A vertically scrolling surface.
 *
 * Built on Base UI ScrollArea with three departures. The viewport is never a
 * tab stop: Base UI makes every scrollable viewport one, which puts an extra
 * stop in front of every list of buttons and gets in the way of arrow keys in
 * a menu. It scrolls only vertically, and its content is as wide as the
 * viewport rather than as wide as its widest child, so a long label cannot
 * push a row's right edge out of sight. */
export function ScrollArea(props: ScrollAreaProps) {
  const {
    children,
    className,
    contentClassName,
    scrollbar = 'overlay',
    fade = false,
    bottomInset,
    style,
    ...restProps
  } = props
  return (
    <ScrollAreaPrimitive.Root
      className={cn(
        'relative flex min-h-0 flex-col overflow-hidden',
        className
      )}
      style={
        bottomInset
          ? ({
              '--kit-scroll-bottom-inset': bottomInset,
              ...style,
            } as CSSProperties)
          : style
      }
      {...restProps}
    >
      <ScrollAreaPrimitive.Viewport
        tabIndex={-1}
        // After Base UI's own `overflow: scroll`, which this narrows to the
        // vertical axis.
        style={{ overflowX: 'hidden' }}
        className={cn(
          'kit-scroll-viewport min-h-0 flex-auto overscroll-contain outline-none',
          fade && 'kit-edge-fade'
        )}
      >
        <ScrollAreaPrimitive.Content
          style={{ minWidth: 0 }}
          className={contentClassName}
        >
          {children}
        </ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      {scrollbar === 'overlay' && (
        <ScrollAreaPrimitive.Scrollbar className="kit-scrollbar">
          <ScrollAreaPrimitive.Thumb className="kit-scrollbar-thumb" />
        </ScrollAreaPrimitive.Scrollbar>
      )}
    </ScrollAreaPrimitive.Root>
  )
}

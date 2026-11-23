import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import './ScrollArea.css'
import './edgeFade.css'

export type ScrollAreaProps = Omit<
  ScrollAreaPrimitive.Root.Props,
  'className' | 'children' | 'render' | 'style'
> & {
  /** Access to the native scroll element, for virtualized content. */
  viewportRef?: Ref<HTMLDivElement>
  children?: ReactNode
  style?: CSSProperties
  className?: string
  /** Keep side padding on rows with sticky headers: sticky elements cannot leave the parent's content box. */
  contentClassName?: string
  /** `overlay` shows a thin thumb while the area is hovered or scrolled.
   * `none` is for small popups, where `fade` says the list goes on. */
  scrollbar?: 'overlay' | 'none'
  /** The mask fades everything inside the viewport, including sticky headers. Put persistent headers above it. */
  fade?: boolean
  /** This CSS length lifts the thumb and reserves room after the last row inside the scrollport. Nested areas start at zero. */
  insetBottom?: string
  /** Reserve focus scroll padding and track room for an overlay above. The content supplies its own leading offset. */
  insetTop?: string
}

/** Keep the viewport out of the tab order and clamp the content to its width so long labels cannot push rows sideways. */
export function ScrollArea(props: ScrollAreaProps) {
  const {
    children,
    viewportRef,
    className,
    contentClassName,
    scrollbar = 'overlay',
    fade = false,
    insetBottom,
    insetTop,
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
        {
          '--kit-scroll-bottom-inset': insetBottom,
          '--kit-scroll-top-inset': insetTop,
          ...style,
        } as CSSProperties
      }
      {...restProps}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
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

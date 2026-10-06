import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '@/6-shared/ui/shadcn/utils'

export type ListPanelProps = useRender.ComponentProps<'div'> & {
  header?: ReactNode
  /** Register the actual scrollport with the owning list primitive. */
  scrollRender?: useRender.ComponentProps<'div'>['render']
  /** Actions follow the list in the same scrollport, outside its semantics. */
  actions?: ReactNode
  /** Shown above the scrollport, never inside it: a listbox holds options.
   * A frozen panel keeps its spare room below, where the rows would have been. */
  empty?: ReactNode
  /** Freeze the last natural height while filtering; viewport limits still win. */
  preserveHeight?: boolean
}

/** Surface only: the owner supplies list semantics, focus and positioning. */
export function ListPanel(props: ListPanelProps) {
  const {
    header,
    scrollRender,
    actions,
    empty,
    preserveHeight = false,
    className,
    children,
    render,
    ref,
    ...restProps
  } = props
  const [panel, setPanel] = useState<HTMLElement | null>(null)
  const head = useRef<HTMLDivElement>(null)
  const notice = useRef<HTMLDivElement>(null)
  const scroll = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const retainedHeight = useRef(0)

  useLayoutEffect(() => {
    const scroller = scroll.current
    const body = content.current
    if (!panel || !scroller || !body) return
    let frame = 0
    let previousHeight = scroller.clientHeight
    const edges = () => {
      scroller.parentElement!.dataset.fade = scrollFadeEdges(scroller)
    }
    const measure = () => {
      // Freeze the pre-filter height, including intermediate queries that match
      // more results. Explicit expansion resumes measurement when not frozen.
      if (!preserveHeight || retainedHeight.current === 0) {
        // Everything the panel holds, not only what scrolls.
        retainedHeight.current = [body, head.current, notice.current].reduce(
          (total, part) => total + (part?.getBoundingClientRect().height ?? 0),
          0
        )
      }
      panel.style.setProperty(
        '--list-panel-height',
        `${retainedHeight.current}px`
      )

      // Keep the keyboard target visible when the viewport (for example, its
      // virtual keyboard boundary) reduces the scrollport's height.
      const height = scroller.clientHeight
      const active = scroller.ownerDocument.activeElement
      if (
        height < previousHeight &&
        active &&
        active !== scroller &&
        scroller.contains(active)
      ) {
        const bounds = scroller.getBoundingClientRect()
        const target = active.getBoundingClientRect()
        if (target.bottom > bounds.bottom)
          scroller.scrollTop += target.bottom - bounds.bottom
        else if (target.top < bounds.top)
          scroller.scrollTop += target.top - bounds.top
      }
      previousHeight = height
      edges()
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    measure()
    const observer = new ResizeObserver(schedule)
    observer.observe(body)
    observer.observe(scroller)
    if (head.current) observer.observe(head.current)
    if (notice.current) observer.observe(notice.current)
    scroller.addEventListener('scroll', edges, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      scroller.removeEventListener('scroll', edges)
      panel.style.removeProperty('--list-panel-height')
    }
  }, [panel, preserveHeight])

  // Its own scrollport rather than a ScrollArea: the scroller has to be the
  // list primitive's element, which owns scroll-to-selected and keyboard
  // navigation, and a ScrollArea viewport rendered as that element would
  // replace its listbox role.
  const scrollport = useRender({
    defaultTagName: 'div',
    render: scrollRender,
    ref: scroll,
    props: {
      className:
        'min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-p-1 [scrollbar-width:none]',
      children: (
        <div ref={content} className="flow-root p-1">
          {children}
          {actions}
        </div>
      ),
    },
  })

  return useRender({
    defaultTagName: 'div',
    render,
    ref: [ref ?? null, setPanel],
    props: {
      ...restProps,
      className: cn(
        // The surface clips at its own corners; no padding around the scrollport.
        'flex w-80 max-w-[var(--available-width,calc(100dvw-var(--list-panel-margin,16px)*2))] flex-col overflow-hidden rounded-ui-popover rounded-smooth bg-ui-popover text-ui-primary shadow-ui-popover outline-none',
        // The margin matches the positioner's collision padding, which sets
        // `--list-panel-margin`; standalone panels fall back to the same 16px.
        'h-[var(--list-panel-height,auto)] max-h-[min(var(--available-height,100dvh),calc(100dvh-var(--list-panel-margin,16px)*2))]',
        className
      ),
      children: (
        <>
          <div
            ref={head}
            className={cn('shrink-0', header != null && 'px-1 pt-1')}
          >
            {header}
          </div>
          <div ref={notice} className="shrink-0">
            {empty}
          </div>
          <div className="group/panel-scroll relative flex min-h-0 flex-1 flex-col">
            {scrollport}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-linear-to-b from-ui-popover to-transparent opacity-0 group-data-[fade=top]/panel-scroll:opacity-100 group-data-[fade=both]/panel-scroll:opacity-100"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-linear-to-t from-ui-popover to-transparent opacity-0 group-data-[fade=bottom]/panel-scroll:opacity-100 group-data-[fade=both]/panel-scroll:opacity-100"
            />
          </div>
        </>
      ),
    },
  })
}

/** Which edges of a scrollport have more content past them. */
function scrollFadeEdges(element: HTMLElement) {
  // A pixel of slack: fractional scroll positions are ordinary at fractional
  // zoom, and an edge a hair from the end still counts as the end.
  const above = element.scrollTop > 1
  const below =
    element.scrollTop + element.clientHeight < element.scrollHeight - 1
  return above && below ? 'both' : above ? 'top' : below ? 'bottom' : ''
}

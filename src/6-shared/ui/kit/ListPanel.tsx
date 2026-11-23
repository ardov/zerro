import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '@/6-shared/ui/shadcn/utils'
import './edgeFade.css'

export type ListPanelProps = useRender.ComponentProps<'div'> & {
  surface?: 'popover' | 'embedded'
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

export function ListPanel(props: ListPanelProps) {
  const {
    header,
    surface = 'popover',
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
  const hasHeader = header != null && typeof header !== 'boolean'
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
      scroller.style.setProperty(
        '--scroll-area-overflow-y-start',
        `${Math.max(0, scroller.scrollTop)}px`
      )
      scroller.style.setProperty(
        '--scroll-area-overflow-y-end',
        `${Math.max(0, scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop)}px`
      )
    }
    const measure = () => {
      // Freeze the pre-filter height, including intermediate queries that match
      // more results. Explicit expansion resumes measurement when not frozen.
      if (!preserveHeight || retainedHeight.current === 0) {
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

  // Use the list primitive as the scrollport so it retains its listbox role and scroll-to-selected behavior.
  const scrollport = useRender({
    defaultTagName: 'div',
    render: scrollRender,
    ref: scroll,
    props: {
      className:
        'kit-edge-fade min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none]',
      children: (
        <div
          ref={content}
          className={cn(
            'flow-root',
            surface === 'popover'
              ? 'p-1'
              : cn(
                  'px-2 pb-[var(--kit-scroll-bottom-inset,0px)]',
                  hasHeader && 'pt-1'
                )
          )}
        >
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
        'flex min-h-0 flex-col overflow-hidden text-ui-primary outline-none',
        surface === 'popover'
          ? 'w-80 max-w-[var(--available-width,calc(100dvw-var(--list-panel-margin,16px)*2))] rounded-ui-popover rounded-smooth bg-ui-popover shadow-ui-popover max-h-[min(var(--available-height,100dvh),calc(100dvh-var(--list-panel-margin,16px)*2))]'
          : 'w-full max-h-full',
        // The margin matches the positioner's collision padding, which sets
        // `--list-panel-margin`; standalone panels fall back to the same 16px.
        'h-[var(--list-panel-height,auto)]',
        className
      ),
      children: (
        <>
          <div
            ref={head}
            className={cn(
              'shrink-0',
              hasHeader && 'pt-1',
              hasHeader && (surface === 'popover' ? 'px-1' : 'px-2')
            )}
          >
            {header}
          </div>
          <div
            ref={notice}
            className={cn('shrink-0', surface === 'embedded' && 'px-2')}
          >
            {empty}
          </div>
          {scrollport}
        </>
      ),
    },
  })
}

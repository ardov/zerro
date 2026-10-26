import type { ReactNode } from 'react'
import { ScrollArea } from '@/6-shared/ui/kit/ScrollArea'

import './layout.css'

type PanelProps = {
  children?: ReactNode
}

type PanelScrollableProps = PanelProps & {
  /** Padding and layout of the content, inside the scroll. */
  contentClassName?: string
}

/** A rounded surface for content that manages its own scrolling. */
export function Panel({ children }: PanelProps) {
  return (
    <section className="layout-panel rounded-smooth flex overflow-hidden">
      {children}
    </section>
  )
}

/** A rounded surface with its own scrollport, edge to edge. */
export function PanelScrollable({
  children,
  contentClassName,
}: PanelScrollableProps) {
  return (
    <ScrollArea
      className="layout-panel rounded-smooth"
      contentClassName={contentClassName}
    >
      {children}
    </ScrollArea>
  )
}

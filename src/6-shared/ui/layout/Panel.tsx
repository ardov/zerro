import type { ReactNode } from 'react'
import { ScrollArea } from '@/6-shared/ui/kit/ScrollArea'

import './layout.css'

type PanelProps = {
  children?: ReactNode
}

type PanelScrollableProps = PanelProps & {
  contentClassName?: string
}

export function Panel({ children }: PanelProps) {
  return (
    <section className="layout-panel rounded-smooth flex overflow-hidden">
      {children}
    </section>
  )
}

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

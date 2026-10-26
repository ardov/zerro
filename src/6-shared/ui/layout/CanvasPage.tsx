import type { ReactNode } from 'react'
import { ScrollArea } from '@/6-shared/ui/kit/ScrollArea'

/** Width and padding belong inside the scroller, so the scroll edge is
 * always the page edge, even for narrow articles. */
export function CanvasPage({ children }: { children: ReactNode }) {
  return (
    <ScrollArea
      className="min-w-0 flex-1"
      contentClassName="min-h-full"
      insetBottom="var(--mobile-navigation-inset, 0px)"
    >
      {children}
    </ScrollArea>
  )
}

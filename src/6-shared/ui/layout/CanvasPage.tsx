import type { ReactNode } from 'react'
import { ScrollArea } from '@/6-shared/ui/kit/ScrollArea'

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

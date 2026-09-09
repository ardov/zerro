import { Drawer } from '@base-ui/react/drawer'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { cn } from './shadcn/utils'

type MobileDrawerViewportProps = {
  children?: ReactNode
  className?: string
}

type ViewportRect = {
  height: number
  left: number
  top: number
  width: number
}

/** The part of the screen a mobile drawer can actually occupy.
 *
 * A software keyboard usually shrinks the visual viewport without shrinking
 * the page. Following that viewport here keeps every drawer — and ordinary
 * sticky content inside it — above the keyboard without teaching forms about
 * browser geometry. */
export function MobileDrawerViewport({
  children,
  className,
}: MobileDrawerViewportProps) {
  const [viewport, setViewport] = useState(readVisualViewport)

  useEffect(() => {
    const visualViewport = window.visualViewport
    if (!visualViewport) return

    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readVisualViewport()
        setViewport(current => (sameRect(current, next) ? current : next))
      })
    }

    visualViewport.addEventListener('resize', update)
    visualViewport.addEventListener('scroll', update)
    return () => {
      cancelAnimationFrame(frame)
      visualViewport.removeEventListener('resize', update)
      visualViewport.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <Drawer.Viewport
      data-slot="mobile-drawer-viewport"
      className={cn(
        'pointer-events-none fixed top-0 left-0 z-modal h-full w-full',
        className
      )}
      style={
        viewport
          ? {
              height: viewport.height,
              left: viewport.left,
              top: viewport.top,
              width: viewport.width,
            }
          : undefined
      }
    >
      {children}
    </Drawer.Viewport>
  )
}

function readVisualViewport(): ViewportRect | null {
  if (typeof window === 'undefined' || !window.visualViewport) return null
  const { height, offsetLeft, offsetTop, width } = window.visualViewport
  return { height, left: offsetLeft, top: offsetTop, width }
}

function sameRect(a: ViewportRect | null, b: ViewportRect | null): boolean {
  return (
    a?.height === b?.height &&
    a?.left === b?.left &&
    a?.top === b?.top &&
    a?.width === b?.width
  )
}

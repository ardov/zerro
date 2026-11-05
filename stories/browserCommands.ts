import { defineBrowserCommand } from '@vitest/browser-playwright'

export const collectBrowserGarbage = defineBrowserCommand(
  async ({ context, page }) => {
    const session = await context.newCDPSession(page)
    try {
      await session.send('HeapProfiler.collectGarbage')
    } finally {
      await session.detach()
    }
  }
)

type DragPositions = {
  /** Fractions of each target's width and height. */
  from?: { x: number; y: number }
  to?: { x: number; y: number }
}

export const dragPointer = defineBrowserCommand(
  async (
    { page, iframe },
    source: string,
    destination: string,
    positions: DragPositions = {}
  ) => {
    const from = await iframe.locator(source).boundingBox()
    const to = await iframe.locator(destination).boundingBox()
    if (!from || !to) throw new Error('Both drag targets must be visible')

    const start = positions.from ?? { x: 0.5, y: 0.5 }
    const end = positions.to ?? { x: 0.5, y: 0.5 }
    await page.mouse.move(
      from.x + from.width * start.x,
      from.y + from.height * start.y
    )
    await page.mouse.down()
    try {
      await page.mouse.move(to.x + to.width * end.x, to.y + to.height * end.y, {
        steps: 15,
      })
    } finally {
      await page.mouse.up()
    }
  }
)

declare module 'vitest/browser' {
  interface BrowserCommands {
    collectBrowserGarbage(): Promise<void>
    dragPointer(
      source: string,
      destination: string,
      positions?: DragPositions
    ): Promise<void>
  }
}

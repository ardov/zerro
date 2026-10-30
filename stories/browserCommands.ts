import { defineBrowserCommand } from '@vitest/browser-playwright'

export const dragPointer = defineBrowserCommand(
  async ({ page, iframe }, source: string, destination: string) => {
    const from = await iframe.locator(source).boundingBox()
    const to = await iframe.locator(destination).boundingBox()
    if (!from || !to) throw new Error('Both drag targets must be visible')

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    try {
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
        steps: 15,
      })
    } finally {
      await page.mouse.up()
    }
  }
)

declare module 'vitest/browser' {
  interface BrowserCommands {
    dragPointer(source: string, destination: string): Promise<void>
  }
}

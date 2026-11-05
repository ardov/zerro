import { Drawer } from '@base-ui/react/drawer'
import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobileDrawerViewport } from './MobileDrawerViewport'

const originalVisualViewport = Object.getOwnPropertyDescriptor(
  window,
  'visualViewport'
)

afterEach(() => {
  vi.restoreAllMocks()
  if (originalVisualViewport) {
    Object.defineProperty(window, 'visualViewport', originalVisualViewport)
  } else {
    Reflect.deleteProperty(window, 'visualViewport')
  }
})

class FakeVisualViewport extends EventTarget {
  height = 640
  offsetLeft = 0
  offsetTop = 12
  width = 360
}

describe('MobileDrawerViewport', () => {
  it('follows the visible screen when browser UI or a keyboard changes it', () => {
    const viewport = new FakeVisualViewport()
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    })
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0)
      return 1
    })

    render(
      <Drawer.Root open>
        <Drawer.Portal>
          <MobileDrawerViewport>
            <div>Drawer content</div>
          </MobileDrawerViewport>
        </Drawer.Portal>
      </Drawer.Root>
    )

    const element = screen.getByText('Drawer content').parentElement!
    expect(element.dataset.slot).toBe('mobile-drawer-viewport')
    expect(element.style.height).toBe('640px')
    expect(element.style.top).toBe('12px')
    expect(element.style.width).toBe('360px')

    act(() => {
      viewport.height = 360
      viewport.offsetTop = 44
      viewport.dispatchEvent(new Event('resize'))
    })

    expect(element.style.height).toBe('360px')
    expect(element.style.top).toBe('44px')
  })
})

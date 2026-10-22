import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { TextFade } from './TextFade'

let notify: (() => void) | null = null
const observedElements: Element[] = []
const widths = { scroll: 0, client: 0 }
const scrollWidthReads = vi.fn()

beforeEach(() => {
  widths.scroll = 300
  widths.client = 100
  scrollWidthReads.mockClear()
  observedElements.length = 0
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        notify = callback
      }
      observe(target: Element) {
        observedElements.push(target)
      }
      disconnect() {}
    }
  )
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
    () => {
      scrollWidthReads()
      return widths.scroll
    }
  )
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
    () => widths.client
  )
})

afterEach(() => {
  cleanup()
  notify = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('reads no layout while rendering and committing', () => {
  render(<TextFade>A long label</TextFade>)
  expect(scrollWidthReads).not.toHaveBeenCalled()
})

it('marks overflow when the resize observer reports', () => {
  const { rerender } = render(<TextFade className="x">A long label</TextFade>)
  notify!()
  const label = screen.getByText('A long label')
  expect(label).toHaveAttribute('data-overflow')

  rerender(<TextFade className="y">A long label</TextFade>)
  expect(label).toHaveAttribute('data-overflow')

  widths.scroll = 80
  notify!()
  expect(label).not.toHaveAttribute('data-overflow')
})

it('follows the element when render switches the tag', () => {
  const { rerender } = render(<TextFade render={<p />}>A long label</TextFade>)
  rerender(<TextFade render={<h2 />}>A long label</TextFade>)
  notify!()

  const heading = screen.getByRole('heading', { name: 'A long label' })
  expect(observedElements.at(-1)).toBe(heading)
  expect(heading).toHaveAttribute('data-overflow')
})

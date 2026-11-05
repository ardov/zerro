import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SlideReveal } from './SlideReveal'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SlideReveal', () => {
  it('keeps vertical scrolling native and closes again on a rightward flick', () => {
    vi.spyOn(HTMLElement.prototype, 'setPointerCapture').mockImplementation(
      () => {}
    )
    vi.spyOn(HTMLElement.prototype, 'hasPointerCapture').mockReturnValue(true)
    vi.spyOn(HTMLElement.prototype, 'releasePointerCapture').mockImplementation(
      () => {}
    )
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(110)
      .mockReturnValueOnce(200)
      .mockReturnValueOnce(210)
      .mockReturnValueOnce(220)

    render(
      <SlideReveal
        enabled
        items={[{ key: 'activity', label: 'Activity', value: 10, color: '' }]}
      >
        <div>Budget row</div>
      </SlideReveal>
    )

    const gestureSurface = screen.getByText('Budget row').parentElement!
    const movingSurface = gestureSurface.parentElement!
    expect(gestureSurface.classList.contains('touch-pan-y')).toBe(true)

    fireEvent.pointerDown(gestureSurface, { pointerId: 1, clientX: 200 })
    fireEvent.pointerMove(gestureSurface, { pointerId: 1, clientX: 140 })
    fireEvent.pointerUp(gestureSurface, { pointerId: 1, clientX: 140 })
    expect(movingSurface.style.transform).toBe('translateX(-88px)')

    fireEvent.pointerDown(gestureSurface, { pointerId: 2, clientX: 140 })
    fireEvent.pointerMove(gestureSurface, { pointerId: 2, clientX: 170 })
    fireEvent.pointerUp(gestureSurface, { pointerId: 2, clientX: 170 })
    expect(movingSurface.style.transform).toBe('translateX(0px)')
  })
})

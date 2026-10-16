import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { useContextMenu } from './useContextMenu'

function Row({ onMenu }: { onMenu: () => void }) {
  const handlers = useContextMenu({ onContextMenu: onMenu })
  return (
    <div data-testid="row" {...handlers}>
      Operation
    </div>
  )
}

describe('virtualized touch rows', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone')
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })
  it('does not open a menu after the row unmounts', () => {
    const onMenu = vi.fn()
    const view = render(<Row onMenu={onMenu} />)
    fireEvent.touchStart(view.getByTestId('row'), {
      touches: [{ clientX: 10, clientY: 10 }],
    })
    view.unmount()
    vi.advanceTimersByTime(600)
    expect(onMenu).not.toHaveBeenCalled()
  })
  it('cancels a long press on touchcancel but still supports a new long press', () => {
    const onMenu = vi.fn()
    const view = render(<Row onMenu={onMenu} />)
    const row = view.getByTestId('row')
    fireEvent.touchStart(row, { touches: [{ clientX: 10, clientY: 10 }] })
    fireEvent.touchCancel(row)
    vi.advanceTimersByTime(600)
    expect(onMenu).not.toHaveBeenCalled()
    fireEvent.touchStart(row, { touches: [{ clientX: 10, clientY: 10 }] })
    vi.advanceTimersByTime(600)
    expect(onMenu).toHaveBeenCalledTimes(1)
  })
})

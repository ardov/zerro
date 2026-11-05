import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useLocalDay } from './useLocalDay'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it('updates mounted consumers at local midnight and releases timers on unmount', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 5, 10, 23, 59, 59))
  const first = renderHook(useLocalDay)
  const second = renderHook(useLocalDay)
  expect(first.result.current).toBe(new Date(2026, 5, 10).getTime())
  act(() => vi.advanceTimersByTime(1000))
  expect(first.result.current).toBe(new Date(2026, 5, 11).getTime())
  expect(second.result.current).toBe(first.result.current)
  first.unmount()
  second.unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it.each(['visibilitychange', 'focus'])(
  'catches up after suspended timers on %s',
  event => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 10, 12))
    const { result } = renderHook(useLocalDay)
    act(() => {
      vi.setSystemTime(new Date(2026, 5, 12, 8))
      const target = event === 'focus' ? window : document
      target.dispatchEvent(new Event(event))
    })
    expect(result.current).toBe(new Date(2026, 5, 12).getTime())
    act(() => vi.advanceTimersByTime(16 * 60 * 60 * 1000))
    expect(result.current).toBe(new Date(2026, 5, 13).getTime())
  }
)

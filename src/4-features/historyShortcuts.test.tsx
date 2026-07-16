import { configureStore } from '@reduxjs/toolkit'
import { act, render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it, vi } from 'vitest'

import dataReducer, { appendClientOutboxEntry } from 'store/data'
import isPendingReducer, { setPending } from 'store/isPending'
import {
  getHistoryShortcut,
  handleHistoryShortcut,
  HistoryShortcuts,
  isEditingTarget,
} from './historyShortcuts'

function keydown(init: KeyboardEventInit) {
  return new KeyboardEvent('keydown', { cancelable: true, ...init })
}

describe('history shortcuts', () => {
  it.each([
    [{ key: 'z', code: 'KeyZ', metaKey: true }, 'undo'],
    [{ key: 'Z', code: 'KeyZ', metaKey: true, shiftKey: true }, 'redo'],
    [{ key: 'z', code: 'KeyZ', ctrlKey: true }, 'undo'],
    [{ key: 'z', code: 'KeyZ', ctrlKey: true, shiftKey: true }, 'redo'],
    [{ key: 'y', code: 'KeyY', ctrlKey: true }, 'redo'],
    // Physical-key codes keep shortcuts working with non-Latin layouts.
    [{ key: 'я', code: 'KeyZ', metaKey: true }, 'undo'],
  ] satisfies [KeyboardEventInit, 'undo' | 'redo'][])(
    'maps %o to %s',
    (init, expected) => {
      expect(getHistoryShortcut(keydown(init))).toBe(expected)
    }
  )

  it.each([
    { key: 'z', code: 'KeyZ' },
    { key: 'z', code: 'KeyZ', altKey: true, ctrlKey: true },
    { key: 'z', code: 'KeyZ', ctrlKey: true, metaKey: true },
    { key: 'y', code: 'KeyY', metaKey: true },
    { key: 'y', code: 'KeyY', ctrlKey: true, shiftKey: true },
  ] satisfies KeyboardEventInit[])('ignores %o', init => {
    expect(getHistoryShortcut(keydown(init))).toBeNull()
  })

  it('recognizes native and ARIA text-editing targets', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <input />
      <textarea></textarea>
      <select></select>
      <div contenteditable="true"><span data-child></span></div>
      <div role="textbox"></div>
      <button></button>
    `

    expect(isEditingTarget(container.querySelector('input'))).toBe(true)
    expect(isEditingTarget(container.querySelector('textarea'))).toBe(true)
    expect(isEditingTarget(container.querySelector('select'))).toBe(true)
    expect(isEditingTarget(container.querySelector('[data-child]'))).toBe(true)
    expect(isEditingTarget(container.querySelector('[role="textbox"]'))).toBe(
      true
    )
    expect(isEditingTarget(container.querySelector('button'))).toBe(false)
  })

  it('prevents the browser action and runs an available command', () => {
    const undo = vi.fn()
    const redo = vi.fn()
    const event = keydown({ key: 'z', code: 'KeyZ', metaKey: true })

    handleHistoryShortcut(event, { canUndo: true, canRedo: false, undo, redo })

    expect(event.defaultPrevented).toBe(true)
    expect(undo).toHaveBeenCalledOnce()
    expect(redo).not.toHaveBeenCalled()
  })

  it('does not consume a shortcut when that history direction is unavailable', () => {
    const undo = vi.fn()
    const event = keydown({ key: 'z', code: 'KeyZ', ctrlKey: true })

    handleHistoryShortcut(event, {
      canUndo: false,
      canRedo: false,
      undo,
      redo: vi.fn(),
    })

    expect(event.defaultPrevented).toBe(false)
    expect(undo).not.toHaveBeenCalled()
  })

  it('leaves editing shortcuts to the focused field', () => {
    const input = document.createElement('input')
    const undo = vi.fn()
    const event = keydown({ key: 'z', code: 'KeyZ', metaKey: true })

    input.addEventListener('keydown', receivedEvent =>
      handleHistoryShortcut(receivedEvent, {
        canUndo: true,
        canRedo: true,
        undo,
        redo: vi.fn(),
      })
    )
    input.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(undo).not.toHaveBeenCalled()
  })

  it('moves the Redux history head from the global listener', () => {
    const store = configureStore({
      reducer: { data: dataReducer, isPending: isPendingReducer },
    })
    store.dispatch(
      appendClientOutboxEntry({
        type: 'patch',
        payload: {},
        createdAt: 1,
      })
    )
    const view = render(
      <Provider store={store}>
        <HistoryShortcuts />
      </Provider>
    )

    act(() => {
      window.dispatchEvent(keydown({ key: 'z', code: 'KeyZ', metaKey: true }))
    })
    expect(store.getState().data.outboxHead).toBe(0)

    act(() => {
      window.dispatchEvent(
        keydown({ key: 'Z', code: 'KeyZ', metaKey: true, shiftKey: true })
      )
    })
    expect(store.getState().data.outboxHead).toBe(1)

    view.unmount()
  })

  it('keeps the sent outbox prefix fixed while sync is pending', () => {
    const store = configureStore({
      reducer: { data: dataReducer, isPending: isPendingReducer },
    })
    store.dispatch(
      appendClientOutboxEntry({ type: 'patch', payload: {}, createdAt: 1 })
    )
    store.dispatch(setPending(true))
    const view = render(
      <Provider store={store}>
        <HistoryShortcuts />
      </Provider>
    )

    act(() => {
      window.dispatchEvent(keydown({ key: 'z', code: 'KeyZ', metaKey: true }))
    })

    expect(store.getState().data.outboxHead).toBe(1)
    view.unmount()
  })
})

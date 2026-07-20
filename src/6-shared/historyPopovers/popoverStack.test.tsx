import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { popoverStack } from './popoverStack'

function makeHarness() {
  function Wrapper(props: { children: ReactNode }) {
    return (
      <MemoryRouter
        initialEntries={['/accounts', '/budgets?month=2026-07#activity']}
        initialIndex={1}
      >
        {props.children}
      </MemoryRouter>
    )
  }

  const hook = renderHook(
    () => ({
      actions: popoverStack.useActions(),
      stack: popoverStack.usePopoverStack(),
      location: useLocation(),
      navigate: useNavigate(),
    }),
    { wrapper: Wrapper }
  )

  return { hook }
}

describe('history-backed popover stack', () => {
  it('closes overlays with Back before leaving the current page', () => {
    const { hook } = makeHarness()

    act(() => hook.result.current.actions.open('drawer'))
    act(() => hook.result.current.actions.open('dialog'))

    expect(hook.result.current.location).toMatchObject({
      pathname: '/budgets',
      search: '?month=2026-07',
      hash: '#activity',
      state: { dialogs: ['drawer', 'dialog'] },
    })
    expect(hook.result.current.stack).toEqual(['drawer', 'dialog'])

    act(() => hook.result.current.navigate(-1))
    expect(hook.result.current.location.pathname).toBe('/budgets')
    expect(hook.result.current.stack).toEqual(['drawer'])

    act(() => hook.result.current.navigate(-1))
    expect(hook.result.current.location.pathname).toBe('/budgets')
    expect(hook.result.current.stack).toEqual([])

    act(() => hook.result.current.navigate(-1))
    expect(hook.result.current.location.pathname).toBe('/accounts')
  })

  it('has matching close and Forward history behavior', () => {
    const { hook } = makeHarness()

    act(() => hook.result.current.actions.open('dialog'))
    act(() => hook.result.current.actions.close('dialog'))

    expect(hook.result.current.location.pathname).toBe('/budgets')
    expect(hook.result.current.stack).toEqual([])

    act(() => hook.result.current.navigate(1))
    expect(hook.result.current.location.pathname).toBe('/budgets')
    expect(hook.result.current.stack).toEqual(['dialog'])
  })
})

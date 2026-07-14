import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import { Router } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { popoverStack } from './popoverStack'

function makeHarness() {
  const history = createMemoryHistory({
    initialEntries: ['/accounts', '/budgets?month=2026-07#activity'],
    initialIndex: 1,
  })

  function Wrapper(props: { children: ReactNode }) {
    return <Router history={history}>{props.children}</Router>
  }

  const hook = renderHook(
    () => ({
      actions: popoverStack.useActions(),
      stack: popoverStack.usePopoverStack(),
    }),
    { wrapper: Wrapper }
  )

  return { history, hook }
}

describe('history-backed popover stack', () => {
  it('closes overlays with Back before leaving the current page', () => {
    const { history, hook } = makeHarness()

    act(() => hook.result.current.actions.open('drawer'))
    act(() => hook.result.current.actions.open('dialog'))

    expect(history.location).toMatchObject({
      pathname: '/budgets',
      search: '?month=2026-07',
      hash: '#activity',
      state: { dialogs: ['drawer', 'dialog'] },
    })
    expect(hook.result.current.stack).toEqual(['drawer', 'dialog'])

    act(() => history.goBack())
    expect(history.location.pathname).toBe('/budgets')
    expect(hook.result.current.stack).toEqual(['drawer'])

    act(() => history.goBack())
    expect(history.location.pathname).toBe('/budgets')
    expect(hook.result.current.stack).toEqual([])

    act(() => history.goBack())
    expect(history.location.pathname).toBe('/accounts')
  })

  it('has matching close and Forward history behavior', () => {
    const { history, hook } = makeHarness()

    act(() => hook.result.current.actions.open('dialog'))
    act(() => hook.result.current.actions.close('dialog'))

    expect(history.location.pathname).toBe('/budgets')
    expect(hook.result.current.stack).toEqual([])

    act(() => history.goForward())
    expect(history.location.pathname).toBe('/budgets')
    expect(hook.result.current.stack).toEqual(['dialog'])
  })
})

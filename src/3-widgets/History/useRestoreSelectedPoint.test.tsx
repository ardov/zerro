import '@testing-library/jest-dom'
import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { describe, expect, it, vi } from 'vitest'
import { undoClientCommand } from '@/store/data'
import { rootReducer } from '@/store/rootReducer'
import { makeCoreNextDemoRootState } from '@/zerro-core/support/testing/demoState'
import { useRestoreSelectedPoint } from './useRestoreSelectedPoint'

const { show } = vi.hoisted(() => ({ show: vi.fn() }))
vi.mock('@/6-shared/ui/kit/Toast', () => ({
  toast: { add: show },
}))
vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

function Harness() {
  const { canRestore, restore } = useRestoreSelectedPoint()
  return (
    <button disabled={!canRestore} onClick={restore}>
      Restore
    </button>
  )
}

async function setup(changed: boolean) {
  show.mockClear()
  const state = makeCoreNextDemoRootState()
  const snapshot = structuredClone(state.data.current)
  if (changed)
    Object.values(snapshot.transaction)[0].comment = 'Previous comment'
  state.history = {
    browsing: true,
    selection: {
      status: 'ready',
      point: { kind: 'journal', sequence: 1 },
      snapshot,
    },
    entries: [2, 1].map(sequence => ({
      sequence,
      kind: 'checkpoint',
      serverTimestamp: sequence,
      pushed: false,
    })),
    pageStatus: 'ready',
    expandedRuns: [],
  }
  const store = configureStore({ reducer: rootReducer, preloadedState: state })
  const view = render(
    <Provider store={store}>
      <Harness />
    </Provider>
  )
  await userEvent.click(screen.getByRole('button', { name: 'Restore' }))
  return { store, view, before: state.data.current }
}

describe('restoring a server history point', () => {
  it('applies immediately and can undo the complete restore', async () => {
    const { store, before } = await setup(true)
    expect(store.getState().history.browsing).toBe(false)
    expect(store.getState().data.outbox).toHaveLength(1)
    expect(
      Object.values(store.getState().data.current.transaction)[0].comment
    ).toBe('Previous comment')
    expect(show).toHaveBeenCalledExactlyOnceWith({
      title: 'restoreApplied',
      type: 'success',
    })
    act(() => {
      store.dispatch(undoClientCommand())
    })
    expect(store.getState().data.current).toEqual(before)
    expect(store.getState().data.outbox).toHaveLength(0)
  })

  it('reports a no-op without offering undo', async () => {
    const { store } = await setup(false)
    expect(store.getState().data.outbox).toHaveLength(0)
    expect(store.getState().history.browsing).toBe(false)
    expect(show).toHaveBeenCalledExactlyOnceWith({
      title: 'restoreNoChanges',
      type: 'info',
    })
  })
})

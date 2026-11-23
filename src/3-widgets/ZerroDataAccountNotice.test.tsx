import '@testing-library/jest-dom'
import { configureStore } from '@reduxjs/toolkit'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { safeLocalStorage } from '@/6-shared/api/browserStorage'
import { zenmoney } from '@/6-shared/api/zenmoney'
import { i18n } from '@/6-shared/localization'
import { OverlayHost, usePopup } from '@/6-shared/overlays'
import { Dialog } from '@/6-shared/ui/kit/Dialog'
import { useAppDispatch } from '@/store'
import {
  applyServerPatch,
  hydrateReplica,
  redoClientCommand,
  undoClientCommand,
} from '@/store/data'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import { core } from '@/zerro-core/redux'
import { ZERRO_DATA_ACCOUNT_NAME } from '@/zerro-core/constants'
import {
  makeAccount,
  makeInstrument,
  makeStore,
  makeTag,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { ZerroDataAccountNotice } from './ZerroDataAccountNotice'

const title = 'Zerro created a service account'
const month = '2026-11'
const setGoal = () =>
  core.goals.set(month, 'tag#food', {
    type: core.goals.goalType.MONTHLY,
    amount: 100,
  })

function makeNoticeStore(token = 'test-token', userId = 1) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: makeTestRootState(
      makeStore({
        serverTimestamp: 1,
        user: { [userId]: makeUser({ id: userId, parent: null, currency: 1 }) },
        instrument: { 1: makeInstrument({ id: 1, shortTitle: 'USD' }) },
        tag: { food: makeTag({ id: 'food', title: 'Food' }) },
      }),
      { token }
    ),
  })
}

function Editor() {
  const popup = usePopup()
  const dispatch = useAppDispatch()
  return (
    <>
      <button onClick={() => popup.setOpen(true)}>Edit goal</button>
      <Dialog title="Goal" popup={popup}>
        <button onClick={() => dispatch(setGoal())}>Save goal</button>
        <button onClick={() => popup.setOpen(false)}>Done</button>
      </Dialog>
    </>
  )
}

function mount(store: ReturnType<typeof makeNoticeStore>) {
  return render(
    <StrictMode>
      <Provider store={store}>
        <MemoryRouter>
          <OverlayHost>
            <Editor />
            <ZerroDataAccountNotice />
          </OverlayHost>
        </MemoryRouter>
      </Provider>
    </StrictMode>
  )
}

beforeEach(() => {
  safeLocalStorage.clear()
  void i18n.changeLanguage('en')
})
afterEach(cleanup)

describe('Zerro data account notice', () => {
  it('explains the service account created by the first local write', async () => {
    const store = makeNoticeStore()
    mount(store)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => {
      store.dispatch(setGoal())
    })

    expect(await screen.findByRole('dialog', { name: title })).toBeVisible()
    expect(
      screen.getByRole('img', {
        name: `${ZERRO_DATA_ACCOUNT_NAME} has been added to your accounts`,
      })
    ).toBeVisible()
    expect(screen.getByText(/does not affect your balance/)).toBeVisible()
  })

  it('uses two active user accounts in the illustration', async () => {
    const store = makeNoticeStore()
    store.dispatch(
      applyServerPatch({
        account: [
          makeAccount({ id: 'old', title: 'Old account', archive: true }),
          makeAccount({ id: 'debt', title: 'Debts', type: 'debt' }),
          makeAccount({ id: 'card', title: 'My card' }),
          makeAccount({ id: 'cash', title: 'Travel cash' }),
          makeAccount({ id: 'spare', title: 'Spare account' }),
        ],
      })
    )
    mount(store)
    act(() => {
      store.dispatch(setGoal())
    })
    await screen.findByRole('dialog', { name: title })
    expect(screen.getByText('My card')).toBeVisible()
    expect(screen.getByText('Travel cash')).toBeVisible()
    expect(screen.queryByText('Old account')).not.toBeInTheDocument()
    expect(screen.queryByText('Debts')).not.toBeInTheDocument()
    expect(screen.queryByText('Spare account')).not.toBeInTheDocument()
  })

  it('remembers the explanation across undo, redo and reload', async () => {
    const store = makeNoticeStore()
    const first = mount(store)
    act(() => {
      store.dispatch(setGoal())
    })
    await screen.findByRole('dialog', { name: title })
    await userEvent.click(screen.getByRole('button', { name: 'Got it' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    act(() => {
      store.dispatch(undoClientCommand())
    })
    act(() => {
      store.dispatch(redoClientCommand())
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    first.unmount()
    mount(store)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('waits for the editor to close even when the account syncs first', async () => {
    const store = makeNoticeStore()
    mount(store)
    await userEvent.click(screen.getByRole('button', { name: 'Edit goal' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save goal' }))
    expect(
      screen.queryByRole('dialog', { name: title })
    ).not.toBeInTheDocument()

    act(() => {
      store.dispatch(
        hydrateReplica({
          rootUserId: 1,
          base: store.getState().data.current,
          outbox: [],
        })
      )
    })
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(await screen.findByRole('dialog', { name: title })).toBeVisible()
  })

  it('does not explain an existing or downloaded account', () => {
    const store = makeNoticeStore()
    const first = mount(store)
    act(() => {
      store.dispatch(
        applyServerPatch({
          account: [
            makeAccount({ id: 'remote', title: ZERRO_DATA_ACCOUNT_NAME }),
          ],
        })
      )
      store.dispatch(setGoal())
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    first.unmount()
    mount(store)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('explains a local account restored from an unsent outbox', async () => {
    const store = makeNoticeStore()
    store.dispatch(setGoal())
    mount(store)
    expect(await screen.findByRole('dialog', { name: title })).toBeVisible()
  })

  it('does not show for a no-op or demo write', () => {
    const store = makeNoticeStore()
    const first = mount(store)
    act(() => {
      store.dispatch(
        core.budgets.setOwnAssigned([{ id: 'tag#food', month, value: 0 }])
      )
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    first.unmount()
    const demo = makeNoticeStore(zenmoney.fakeToken)
    mount(demo)
    act(() => {
      demo.dispatch(setGoal())
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the shown flag separate for each user', async () => {
    const firstStore = makeNoticeStore()
    const first = mount(firstStore)
    act(() => {
      firstStore.dispatch(setGoal())
    })
    await screen.findByRole('dialog', { name: title })
    first.unmount()
    const otherStore = makeNoticeStore('other-token', 2)
    mount(otherStore)
    act(() => {
      otherStore.dispatch(setGoal())
    })
    expect(await screen.findByRole('dialog', { name: title })).toBeVisible()
  })
})

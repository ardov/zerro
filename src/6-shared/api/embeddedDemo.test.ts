import 'fake-indexeddb/auto'
import { afterEach, expect, it, vi } from 'vitest'
import { safeLocalStorage } from './browserStorage'
import { tokenStorage } from './tokenStorage'
import { replicaStorage } from './replicaStorage'
import { store } from '@/store'
import { loadDemoData, logOut } from '@/4-features/authorization'
import { fakeToken } from './zenmoney/fetchDiff'

vi.mock('@/6-shared/embeddedDemo', () => ({ isEmbeddedDemo: true }))

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  safeLocalStorage.clear()
})

it('can load, edit preferences and log out without touching the saved account', async () => {
  localStorage.setItem('zm_token', 'saved-account-token')
  localStorage.setItem('language', 'ru')
  const open = vi.spyOn(indexedDB, 'open')
  expect(tokenStorage.get()).toBeNull()
  expect(await replicaStorage.loadCurrent()).toBeNull()
  await store.dispatch(loadDemoData())
  expect(store.getState().token).toBe(fakeToken)
  expect(
    Object.keys(store.getState().data.current.transaction).length
  ).toBeGreaterThan(0)
  safeLocalStorage.setItem('language', 'en')
  expect(safeLocalStorage.getItem('language')).toBe('en')
  await store.dispatch(logOut())
  safeLocalStorage.clear()
  expect(store.getState().token).toBeNull()
  expect(localStorage.getItem('zm_token')).toBe('saved-account-token')
  expect(localStorage.getItem('language')).toBe('ru')
  expect(open).not.toHaveBeenCalled()
})

import { safeLocalStorage } from '@/6-shared/api/browserStorage'

export type StartPage = '/transactions' | '/budget'

const storageKey = 'startPage'

export function getStartPage(): StartPage {
  return safeLocalStorage.getItem(storageKey) === '/budget'
    ? '/budget'
    : '/transactions'
}

export function setStartPage(page: StartPage) {
  safeLocalStorage.setItem(storageKey, page)
}

import { useLocalStorage } from 'helpers/useLocalStorage'

export function useDevMode() {
  return useLocalStorage('devMode', false)
}

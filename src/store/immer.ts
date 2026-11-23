import { setAutoFreeze } from 'immer'

/** Production skips Immer's full-snapshot freeze on the main thread. Development and tests still catch mutations. */
export function configureImmer(production: boolean) {
  setAutoFreeze(!production)
}

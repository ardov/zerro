import { setAutoFreeze } from 'immer'

/**
 * Immer deep-freezes every new object a reducer stores, which for a replaced
 * data snapshot means walking every row on the main thread. Production skips
 * the freeze; development and tests keep it, so a mutation still throws there.
 */
export function configureImmer(production: boolean) {
  setAutoFreeze(!production)
}

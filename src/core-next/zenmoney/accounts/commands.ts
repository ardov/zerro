import type { OptionalExceptFor, TAccount, TDataStore } from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'

export type TZenMoneyAccountPatch = OptionalExceptFor<TAccount, 'id'>

export function compilePatchAccount(
  data: TDataStore,
  patch: TZenMoneyAccountPatch | TZenMoneyAccountPatch[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const list = Array.isArray(patch) ? patch : [patch]

  return {
    account: list.map(item => {
      if (!item.id) throw new Error('Trying to patch account without id')

      const current = data.account[item.id]
      if (!current) throw new Error('Account not found')

      return { ...current, ...item, changed: ctx.now() }
    }),
  }
}

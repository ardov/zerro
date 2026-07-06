import type { OptionalExceptFor } from '6-shared/types'
import type { TCoreContext } from '../../types'
import type { TMerchant, TMerchantId } from './types'

export type TMerchantDraft = OptionalExceptFor<TMerchant, 'user' | 'title'>

export function makeMerchant(
  draft: TMerchantDraft,
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TMerchant {
  return {
    user: draft.user,
    title: draft.title,

    id: draft.id || (ctx.uuid() as TMerchantId),
    changed: draft.changed || ctx.now(),
  }
}

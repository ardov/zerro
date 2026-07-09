import type { OptionalExceptFor } from '../../shared/types'
import type { TCoreContext } from '../../types'
import type { TMerchant, TMerchantId } from './types'

export function makeMerchant(
  draft: OptionalExceptFor<TMerchant, 'user' | 'title'>,
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TMerchant {
  return {
    user: draft.user,
    title: draft.title,

    id: draft.id || (ctx.uuid() as TMerchantId),
    changed: draft.changed || ctx.now(),
  }
}

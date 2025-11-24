import { v1 as uuidv1 } from 'uuid'
import { Modify, OptionalExceptFor } from '6-shared/types'
import { TMerchant, TMerchantId } from '6-shared/types'

export type TMerchantDraft = OptionalExceptFor<TMerchant, 'user' | 'title'>

export function makeMerchant(draft: TMerchantDraft): TMerchant {
  return {
    // Required
    user: draft.user,
    title: draft.title,

    // Optional
    id: draft.id || (uuidv1() as TMerchantId),
    changed: draft.changed || Date.now(),
  }
}

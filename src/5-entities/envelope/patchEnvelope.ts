import { executeCommand } from 'core-next/adapters/redux'
import type { AppThunk } from 'store'
import { OptionalExceptFor } from '6-shared/types'
import { TEnvelope } from './shared/makeEnvelope'

export type TEnvelopeDraft = OptionalExceptFor<TEnvelope, 'id'>

export const patchEnvelope = (
  draft: TEnvelopeDraft | TEnvelopeDraft[]
): AppThunk =>
  executeCommand({
    type: 'zerro.envelope.patch',
    payload: Array.isArray(draft) ? draft : [draft],
  })

import { describe, expect, it } from 'vitest'
import { envId, EnvType } from './envelopeId'

describe('envelope id helpers', () => {
  it('roundtrips envelope ids', () => {
    const id = envId.get(EnvType.Account, 'account-1')

    expect(id).toBe('account#account-1')
    expect(envId.parse(id)).toEqual({
      type: EnvType.Account,
      id: 'account-1',
    })
  })

  it('preserves the legacy null tag id encoding', () => {
    const id = envId.get(EnvType.Tag, null)

    expect(id).toBe('tag#null')
    expect(envId.parse(id)).toEqual({
      type: EnvType.Tag,
      id: 'null',
    })
  })
})

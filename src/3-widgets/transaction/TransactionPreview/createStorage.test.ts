import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  loadLastTransactionAccount,
  saveLastTransactionAccount,
} from './createStorage'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('transaction creation storage', () => {
  it('tolerates blocked storage access', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(loadLastTransactionAccount()).toBeNull()
    expect(() => saveLastTransactionAccount('card')).not.toThrow()
  })

  it('tolerates failed reads and full storage', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('full')
      },
    })
    expect(loadLastTransactionAccount()).toBeNull()
    expect(() => saveLastTransactionAccount('card')).not.toThrow()
  })

  it('keeps the last successfully used account on the device', () => {
    expect(loadLastTransactionAccount()).toBeNull()
    saveLastTransactionAccount('card')
    expect(loadLastTransactionAccount()).toBe('card')
  })
})

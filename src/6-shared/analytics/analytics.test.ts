import { afterEach, describe, expect, it, vi } from 'vitest'
import { track } from './analytics'

describe('analytics', () => {
  afterEach(() => vi.restoreAllMocks())

  it('logs a structured event outside production', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    track('transaction_deleted', {
      mode: 'single',
      source: 'preview',
    })

    expect(log).toHaveBeenCalledWith('[analytics]', 'transaction_deleted', {
      mode: 'single',
      source: 'preview',
    })
  })
})

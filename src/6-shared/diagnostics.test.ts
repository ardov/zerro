import { beforeEach, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/browser'
import {
  makeMerchant,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'

vi.mock('@sentry/browser', () => ({ captureMessage: vi.fn() }))
vi.mock('@/6-shared/config', () => ({ isProduction: true }))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

it('reports separate owner anomalies with counts, without row data, once per source per page', async () => {
  const { captureMerchantUserWarnings } = await import('./diagnostics')
  const missing = makeMerchant({
    id: 'private-missing-id',
    title: 'Private title',
  })
  delete missing.user
  const store = {
    merchant: {
      missing,
      empty: makeMerchant({ id: 'private-null-id', user: null }),
      foreign: makeMerchant({ id: 'private-foreign-id', user: 999 }),
      valid: makeMerchant({ id: 'private-valid-id', user: 1 }),
    },
    user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
  }
  captureMerchantUserWarnings(store, 'local')
  captureMerchantUserWarnings(store, 'local')
  expect(vi.mocked(Sentry.captureMessage).mock.calls).toEqual(
    ['missing', 'null', 'missing_reference'].map(reason => [
      'Merchant user anomaly',
      {
        level: 'warning',
        fingerprint: ['merchant-user-anomaly', reason],
        tags: { entity: 'merchant', field: 'user', reason, source: 'local' },
        extra: { count: 1, merchantCount: 4, userCount: 1 },
      },
    ])
  )
  captureMerchantUserWarnings(store, 'full-reload')
  expect(Sentry.captureMessage).toHaveBeenCalledTimes(6)
})

it('does not let diagnostic failures interrupt loading', async () => {
  const { captureMerchantUserWarnings } = await import('./diagnostics')
  vi.mocked(Sentry.captureMessage).mockImplementationOnce(() => {
    throw new Error('telemetry unavailable')
  })
  expect(() =>
    captureMerchantUserWarnings(
      {
        merchant: { shop: makeMerchant({ id: 'shop', user: null }) },
        user: {},
      },
      'local'
    )
  ).not.toThrow()
})

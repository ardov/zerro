import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { i18n } from '@/6-shared/localization'
import { formatTransactionTimestamp } from './formatDate'

beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 30, 14, 30))
  await i18n.changeLanguage('ru')
})
afterEach(() => vi.useRealTimers())

it.each([
  [new Date(2026, 8, 30, 14, 29, 1), 'только что'],
  [new Date(2026, 8, 30, 14, 29), '1 мин назад'],
  [new Date(2026, 8, 30, 13, 30, 1), '59 мин назад'],
  [new Date(2026, 8, 30, 13, 30), 'Сегодня, 13:30'],
  [new Date(2026, 8, 29, 15, 0), 'Вчера, 15:00'],
  [new Date(2026, 0, 23, 10, 5), '23 янв, 10:05'],
  [new Date(2025, 0, 23, 10, 5), '23 янв 2025, 10:05'],
])('formats %s as %s', (date, expected) => {
  expect(formatTransactionTimestamp(date)).toBe(expected)
})

it('uses the current language', async () => {
  await i18n.changeLanguage('en')
  expect(formatTransactionTimestamp(new Date(2026, 8, 30, 14, 25))).toBe(
    '5 min ago'
  )
})

import { describe, expect, test } from 'vitest'
import { i18n } from '@/6-shared/localization'
import type { TISODate } from '@/6-shared/types'
import { getDateFilterLabel } from './dateFilterLabel'

const now = new Date(2026, 5, 10, 12)
function label(from?: string, to?: string, language = 'en', today = now) {
  return getDateFilterLabel(
    {
      kind: 'date',
      from: from as TISODate | undefined,
      to: to as TISODate | undefined,
    },
    i18n.getFixedT(language, 'filterDrawer'),
    language,
    today
  )
}

describe('date filter label', () => {
  test.each([
    ['2026-06-04', '2026-06-10', '4–10 Jun'],
    ['2025-06-04', '2025-06-10', '4–10 Jun 2025'],
    ['2026-04-04', '2026-06-10', '4 Apr – 10 Jun'],
    ['2025-04-04', '2025-06-10', '4 Apr – 10 Jun 2025'],
    ['2025-12-04', '2026-06-10', '4 Dec 2025 – 10 Jun 2026'],
    ['2026-06-01', '2026-06-30', 'Jun'],
    ['2025-09-01', '2025-09-30', 'Sep 2025'],
    ['2024-02-01', '2024-02-29', 'Feb 2024'],
    ['2024-02-01', '2024-02-28', '1–28 Feb 2024'],
    ['2026-06-10', '2026-06-10', 'Today'],
    ['2026-06-09', '2026-06-09', 'Yesterday'],
    ['2025-06-04', '2025-06-04', '4 Jun 2025'],
    ['2026-06-04', undefined, 'From 4 Jun'],
    [undefined, '2025-06-04', 'Through 4 Jun 2025'],
    [undefined, undefined, 'Date'],
  ])('%s to %s → %s', (from, to, expected) => {
    expect(label(from, to)).toBe(expected)
  })
  test('yesterday crosses the year boundary in local calendar time', () => {
    expect(
      label('2025-12-31', '2025-12-31', 'en', new Date(2026, 0, 1, 0, 30))
    ).toBe('Yesterday')
  })
  test('uses Russian month and relative labels', () => {
    expect(label('2026-06-04', '2026-06-10', 'ru')).toBe('4–10 июн.')
    expect(label('2026-06-10', '2026-06-10', 'ru')).toBe('Сегодня')
    expect(label(undefined, '2026-06-04', 'ru')).toBe('По 4 июн.')
  })
})

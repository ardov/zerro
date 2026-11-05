import { expect, it } from 'vitest'
import { convertKeyboardLayout } from './keyboardLayout'

it.each([
  ['en-ru', '  Ghjlerns  ', '  Продукты  '],
  ['ru-en', 'КУМЩДГЕ', 'REVOLUT'],
  ['ru-en', 'ФЖИ', 'A:B'],
  ['ru-en', 'ХЪЖЭБЮЁ', '{}:"<>~'],
  ['en-ru', '#$^&|', '№;:?/'],
  ['ru-en', '№;:?/', '#$^&|'],
  ['en-ru', ';bkm`', 'жильё'],
  ['en-ru', ':BKM~', 'ЖИЛЬЁ'],
  ['en-ru', '[kt,', 'хлеб'],
  ['en-ru', '{KT<', 'ХЛЕБ'],
  ['en-ru', 'Tlf/ Rfat', 'Еда. Кафе'],
  ['en-ru', 'Tlf? rfat', 'Еда, кафе'],
  ['ru-en', 'Сщаауу.Еуф,', 'Coffee/Tea?'],
  ['ru-en', 'Revolut УГК', 'Revolut EUR'],
  ['en-ru', 'Карта USD', 'Карта ГЫВ'],
] as const)('converts %s: %s → %s', (direction, text, expected) => {
  expect(convertKeyboardLayout(text, direction)).toBe(expected)
})

it('preserves whitespace, numbers, and unknown symbols in both directions', () => {
  const text = ' 123 € 🥕\n'
  expect(convertKeyboardLayout(text, 'en-ru')).toBe(text)
  expect(convertKeyboardLayout(text, 'ru-en')).toBe(text)
})

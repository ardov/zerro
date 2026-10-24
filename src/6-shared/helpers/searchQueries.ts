import { convertKeyboardLayout } from './keyboardLayout'

/** Original query plus both directions of the English/Russian keyboard layout.
 * Convert before lowercasing: uppercase letters can map to punctuation (Ж → :). */
export function searchQueries(query: string): string[] {
  const variants = [
    query,
    convertKeyboardLayout(query, 'en-ru'),
    convertKeyboardLayout(query, 'ru-en'),
  ]
  return [
    ...new Set(variants.map(variant => variant.trim().toLocaleLowerCase())),
  ]
}

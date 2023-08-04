/**
 * Cleans name from whitespaces and punctuation marks.
 * Leaves only digits and latin and cyrillic letters.
 */
export function cleanPayee(name: string) {
  return name.replace(/[^\d\wа-яА-ЯёЁ]/g, '').toLowerCase()
}

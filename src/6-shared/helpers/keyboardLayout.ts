// Standard US/Russian keyboard positions, unshifted keys followed by Shift.
const english =
  "`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./" +
  '~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:"ZXCVBNM<>?'
const russian =
  'ё1234567890-=йцукенгшщзхъ\\фывапролджэячсмитьбю.' +
  'Ё!"№;%:?*()_+ЙЦУКЕНГШЩЗХЪ/ФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,'

/** Convert keyboard positions without normalizing case, whitespace, or unknown symbols. */
export function convertKeyboardLayout(
  text: string,
  direction: 'en-ru' | 'ru-en'
): string {
  const [from, to] =
    direction === 'en-ru' ? [english, russian] : [russian, english]
  return [...text]
    .map(character => {
      const index = from.indexOf(character)
      return index < 0 ? character : to[index]
    })
    .join('')
}

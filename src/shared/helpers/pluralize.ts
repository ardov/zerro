// Example:
// pluralize(1, ['минута', 'минуты', 'минут'])

export default function pluralize(
  n: number,
  textForms: [string, string, string]
) {
  let n1 = Math.abs(n) % 100
  let n2 = n1 % 10
  if (n1 > 10 && n1 < 20) return textForms[2]
  if (n2 > 1 && n2 < 5) return textForms[1]
  if (n2 === 1) return textForms[0]
  return textForms[2]
}

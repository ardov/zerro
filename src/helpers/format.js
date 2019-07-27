export function formatMoney(amount, shortCode) {
  return new Intl.NumberFormat('ru', {
    style: 'currency',
    currency: shortCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

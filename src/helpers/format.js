export function formatMoney(amount, shortCode, decimals = 2) {
  return new Intl.NumberFormat('ru', {
    style: shortCode ? 'currency' : 'decimal',
    currency: shortCode || undefined,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

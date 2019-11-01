export function formatMoney(amount, shortCode, decimals = 2) {
  return new Intl.NumberFormat('ru', {
    style: shortCode ? 'currency' : 'decimal',
    currency: shortCode || undefined,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function getCurrencySymbol(currency) {
  return Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  })
    .format(0)
    .slice(5)
}

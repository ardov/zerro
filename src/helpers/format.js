export function formatMoney(amount, shortCode, decimals = 2) {
  try {
    return new Intl.NumberFormat('ru', {
      style: shortCode ? 'currency' : 'decimal',
      currency: shortCode || undefined,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)
  } catch (error) {
    return (
      new Intl.NumberFormat('ru', {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount) +
      ' ' +
      shortCode
    )
  }
}

export function getCurrencySymbol(currency) {
  return Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  })
    .format(0)
    .slice(5)
}

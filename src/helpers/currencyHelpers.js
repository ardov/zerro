export const round = (amount, digits = 2) => +amount.toFixed(digits)

export const convertAmount = (
  amount,
  instrumentId,
  targetInstrumentId,
  instruments,
  digits = 2
) =>
  round(
    (amount * instruments[instrumentId].rate) /
      instruments[targetInstrumentId].rate,
    digits
  )

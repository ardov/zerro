import { toISODate } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'
import { TDateDraft, TFxCode, TISODate } from '@shared/types'

export const firstPossibleDate: TISODate = '2020-11-22'

export async function requestRates(date: TDateDraft) {
  const base = 'usd'
  const isoDate = toISODate(date)
  const isInFuture = toISODate(new Date()) < isoDate
  if (isInFuture) {
    throw new Error(
      'Requesting future rates. Understandable intention yet imposible 😔'
    )
  }
  const response = await fetch(
    `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${isoDate}/currencies/${base}.json`
  ).then(
    resp => resp.json(),
    reason => {
      throw new Error('Unable to load rates', reason)
    }
  )
  const rates = response?.[base] as Record<TFxCode, number>
  if (!rates) throw new Error('No rates found in a response', response)

  let result: Record<TFxCode, number> = {}

  keys(rates).forEach(key => {
    const code = key.toUpperCase()
    const rate = rates[key]
    switch (code) {
      // convert BTC to µBTC
      case 'BTC':
      case 'ETH':
        result[code] = round((1 / rate) * 1_000_000)
        return
      default:
        result[code] = round(1 / rate)
        return
    }
  })
  return result
}

function round(amount: number) {
  const p = 1_000_000
  return Math.round(amount * p) / p
}

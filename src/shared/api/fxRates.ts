import { toISODate } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'
import { TDateDraft, TFxCode, TISODate } from '@shared/types'

/*
Currency rates are loaded from this great repository by Fawaz Ahmed
https://github.com/fawazahmed0/currency-api
*/

export const firstPossibleDate: TISODate = '2022-01-01'

export async function requestRates(date: TDateDraft) {
  const base = 'usd'
  const isoDate = toISODate(date)
  const isInFuture = toISODate(new Date()) < isoDate
  if (isInFuture) {
    throw new Error(
      'Requesting future rates. Understandable intention yet imposible 😔'
    )
  }

  const response = await fetchWithFallback([
    `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${isoDate}/currencies/usd/${base}.min.json`,
    `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${isoDate}/currencies/usd/${base}.json`,
    `https://raw.githubusercontent.com/fawazahmed0/currency-api/1/${isoDate}/currencies/usd/${base}.min.json`,
    `https://raw.githubusercontent.com/fawazahmed0/currency-api/1/${isoDate}/currencies/usd/${base}.json`,
  ]).then(
    resp => resp?.json(),
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
        result[code] = round(1 / rate / 1_000_000)
        return
      default:
        result[code] = round(1 / rate)
        return
    }
  })
  return result
}

async function fetchWithFallback(links: string[]) {
  let response
  for (let link of links) {
    try {
      response = await fetch(link)
      if (response.ok) return response
    } catch (e) {}
  }
  return response
}

function round(amount: number) {
  const p = 1_000_000
  return Math.round(amount * p) / p
}

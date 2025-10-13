import { toISODate } from '6-shared/helpers/date'
import { keys } from '6-shared/helpers/keys'
import { TDateDraft, TFxCode, TISODate } from '6-shared/types'

/*
Currency rates are loaded from this great repository by Fawaz Ahmed
https://github.com/fawazahmed0/exchange-api
*/

export const firstPossibleDate: TISODate = '2024-03-10'

export async function requestRates(date: TDateDraft) {
  const base = 'usd'
  const isoDate = toISODate(date)
  const isInFuture = toISODate(new Date()) < isoDate
  if (isInFuture) {
    throw new Error(
      'Requesting future rates. Intention understandable yet imposible 😔'
    )
  }

  const response = await fetchWithFallback([
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${isoDate}/v1/currencies/${base}.min.json`,
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${isoDate}/v1/currencies/${base}.json`,
    `https://${isoDate}.currency-api.pages.dev/v1/currencies/${base}.json`,
  ]).then(
    resp => resp?.json(),
    reason => {
      throw new Error(`Unable to load rates. ${reason}`)
    }
  )
  const rates = response?.[base] as Record<TFxCode, number>
  if (!rates) throw new Error(`No rates found in a response. ${response}`)

  let result: Record<TFxCode, number> = {}

  // Convert BTC and other crypto currencies to µ-units.
  // Probably, should be automatically calculated for all currencies with 'μ' prefix
  // or add a multiplier field to currencySymbols.json

  const MICRO_CURRENCIES = new Set([
    'ASH',
    'BCH',
    'BTC',
    'ETH',
    'LTC',
    'XMR'
  ])

  keys(rates).forEach(key => {
    const code = key.toUpperCase()
    const rate = rates[key]
    if (MICRO_CURRENCIES.has(code)) {
      // micro-currencies are tiny after scaling; keep more decimal places
      result[code] = round(1 / rate / 1_000_000, 12)
    } else {
      result[code] = round(1 / rate)
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

function round(amount: number, decimals = 6) {
  const p = Math.pow(10, decimals)
  return Math.round(amount * p) / p
}

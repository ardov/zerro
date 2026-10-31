import { toISODate } from '6-shared/helpers/date'
import { keys } from '6-shared/helpers/keys'
import { TDateDraft, TFxCode, TISODate } from '6-shared/types'

/*
Currency rates are loaded from this great repository by Fawaz Ahmed
https://github.com/fawazahmed0/exchange-api

If all of its mirrors fail, ECB reference rates (~30 currencies) are loaded
as a fallback: "Exchange rates by AllRatesToday" https://allratestoday.com
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

  const rates =
    (await requestFawazRates(isoDate, base)) ??
    (await requestFallbackRates(isoDate, base))
  if (!rates) throw new Error(`Unable to load rates for ${isoDate}`)

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

async function requestFawazRates(isoDate: TISODate, base: string) {
  try {
    const response = await fetchWithFallback([
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${isoDate}/v1/currencies/${base}.min.json`,
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${isoDate}/v1/currencies/${base}.json`,
      `https://${isoDate}.currency-api.pages.dev/v1/currencies/${base}.json`,
    ]).then(resp => resp?.json())
    return response?.[base] as Record<TFxCode, number> | undefined
  } catch (e) {
    return undefined
  }
}

/** Frankfurter-compatible ECB rates; returns lowercase codes like the main source */
async function requestFallbackRates(isoDate: TISODate, base: string) {
  try {
    const response = await fetch(
      `https://allratestoday.com/api/compat/frankfurter/${isoDate}?base=${base.toUpperCase()}`
    )
    if (!response.ok) return undefined
    const data = await response.json()
    if (!data?.rates) return undefined
    const rates: Record<string, number> = { [base]: 1 }
    keys(data.rates as Record<string, number>).forEach(code => {
      rates[code.toLowerCase()] = data.rates[code]
    })
    return rates as Record<TFxCode, number>
  } catch (e) {
    return undefined
  }
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

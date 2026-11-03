import { toISODate } from '@/6-shared/helpers/date'
import { unitsPerWhole } from '@/6-shared/helpers/money/currencyHelpers'
import type {
  TDateDraft,
  TFxCode,
  TInstrument,
  TInstrumentId,
  TISODate,
} from '@/6-shared/types'

/*
Currency rates are loaded from this great repository by Fawaz Ahmed
https://github.com/fawazahmed0/exchange-api
*/

export const firstPossibleDate: TISODate = '2024-03-10'

export async function requestRates(
  date: TDateDraft,
  instruments: Record<TInstrumentId, TInstrument>
) {
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

  const result: Record<TFxCode, number> = {}

  for (const { shortTitle: code, symbol } of Object.values(instruments)) {
    const rate = rates[code.toLowerCase()]
    if (!(rate > 0)) continue

    const units = unitsPerWhole(symbol)
    result[code] = round(1 / rate / units, units === 1 ? 6 : 12)
  }
  return result
}

async function fetchWithFallback(links: string[]) {
  let response
  for (const link of links) {
    try {
      response = await fetch(link)
      if (response.ok) return response
    } catch {}
  }
  return response
}

function round(amount: number, decimals: number) {
  const p = Math.pow(10, decimals)
  return Math.round(amount * p) / p
}

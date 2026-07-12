import { TZmDiff, TInstrumentId, TFxCode } from './data-entities'

type TYear = `${number}${number}${number}${number}`
type TMonth = `${number}${number}`
type TDate = `${number}${number}`
export type TISOMonth = `${TYear}-${TMonth}` // 2000-01
export type TISODate = `${TYear}-${TMonth}-${TDate}` // 2000-01-01

export type TUnixTime = number
export type TMsTime = number

export type TDateDraft = number | TISOMonth | TISODate | Date

export type TUnits = number

export type TToken = string | null

export type TFxAmount = Record<TFxCode, number>
export type TRates = Record<TFxCode, number>

// ---------------------------------------------------------------------
// Other
// ---------------------------------------------------------------------

export type TTagMeta = {
  comment?: string
  currency?: TInstrumentId
}

export type TLocalData = Omit<TZmDiff, 'deletion'>

// The normalized store and patch shapes are owned by Zerro Core.
export type { TDataStore, TDataStorePatch } from 'zerro-core/domain/zenmoney'

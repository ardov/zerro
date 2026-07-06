/** Timestamp from ZenMoney wire data, measured in seconds. */
export type TUnixTime = number

/** Timestamp in normalized core data, measured in milliseconds. */
export type TMsTime = number

type TYear = `${number}${number}${number}${number}`
type TMonth = `${number}${number}`
type TDate = `${number}${number}`

export type TISOMonth = `${TYear}-${TMonth}`
export type TISODate = `${TYear}-${TMonth}-${TDate}`
export type TDateDraft = number | TISOMonth | TISODate | Date

/** Money amount in a single currency/instrument. */
export type TUnits = number

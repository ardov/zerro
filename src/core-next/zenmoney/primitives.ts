/** Timestamp from ZenMoney wire data, measured in seconds. */
export type TUnixTime = number

/** Timestamp in normalized core data, measured in milliseconds. */
export type TMsTime = number

type YYYY = `${number}${number}${number}${number}`
type MM = `${number}${number}`
type DD = `${number}${number}`

export type TISOMonth = `${YYYY}-${MM}`
export type TISODate = `${YYYY}-${MM}-${DD}`
export type TDateDraft = number | TISOMonth | TISODate | Date

/** Money amount in a single currency/instrument. */
export type TUnits = number

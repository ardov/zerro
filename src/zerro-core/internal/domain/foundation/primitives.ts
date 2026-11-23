/** Timestamp from Zenmoney wire data, measured in seconds. */
export type TUnixTime = number

/** Timestamp in normalized Core data, measured in milliseconds. */
export type TMsTime = number

type YYYY = `${number}${number}${number}${number}`
type MM = `${number}${number}`
type DD = `${number}${number}`

export type TISOMonth = `${YYYY}-${MM}`
export type TISODate = `${YYYY}-${MM}-${DD}`
export type TDateDraft = number | TISOMonth | TISODate | Date

export type TUnits = number

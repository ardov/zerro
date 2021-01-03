import { Account, Instrument, Modify } from 'types'
interface Options {
  instruments: {
    [key: number]: Instrument,
  };
}

export type PopulatedAccount = Modify<Account, { instrument: Instrument }>

export const populate = (
  { instruments }: Options,
  raw: Account
): PopulatedAccount => ({
  ...raw,
  instrument: instruments[raw.instrument],
})

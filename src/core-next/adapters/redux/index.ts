/**
 * Public surface of the Redux adapter.
 *
 * Only selectors that real app consumers read belong here — add an export when
 * a consumer switches, not in advance. Everything else in `./selectors` is
 * internal graph wiring (memoization nodes) or is exported there solely for
 * adapter parity tests, and must not leak through this entrypoint.
 */
export {
  selectCoreBudgets,
  selectCoreEnvelopes,
  selectCoreEnvelopeStructure,
  selectCoreKeepingEnvelopeIds,
} from './selectors'

// Root stays the semantic facade only. The reference engine and its outbox
// primitives are an internal implementation detail (the Redux slice imports
// them through `core-next/engine/*` directly); they are not part of the
// package's public surface until a real headless consumer needs a supported
// engine API. See the internal-module decision in documents/design-ledger.md.
export * from './constants'
export * from './types'
export * from './facade'

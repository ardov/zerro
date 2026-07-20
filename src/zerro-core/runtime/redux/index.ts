/**
 * Public surface of the Redux adapter: one `core` namespace grouping every
 * domain. Consumers `import { core } from 'zerro-core/redux'` and read
 * `core.envelopes.selectAll`, `core.transactions.remove`, and so on.
 *
 * The domains live in `namespaces.ts`; only the ones a real consumer reads
 * belong there. Cross-domain memoization wiring stays internal and must not
 * leak through this entrypoint.
 */
export * as core from './namespaces'

/**
 * What the user did, recorded next to what it wrote.
 *
 * A patch says which rows moved; it cannot say whether the user renamed an
 * envelope or repainted it. The label carries that, and it is captured at
 * issue time because the calling command is the only place that knows — by
 * then the intent has already been compiled into rows.
 *
 * A label is inert. Materialization and transport must not read one, and it
 * does not survive a push: a journal point squashes however many commands the
 * server acknowledged into one canonical transition, so history older than the
 * last push is described by its own diff instead.
 */

/**
 * Closed on purpose. Rendering resolves against this union, so a verb without
 * a translation is a compile-time gap rather than a blank row at runtime.
 */
export const commandVerbs = [
  'budget-set',
  'goal-set',
  'fx-rates-set',
  'fx-rates-reset',
  'settings-changed',
  'envelope-created',
  'envelope-renamed',
  'envelope-color-set',
  'envelope-comment-set',
  'envelope-structure-changed',
  'envelope-settings-changed',
  'transaction-created',
  'transaction-edited',
  'transaction-recreated',
  'transactions-deleted',
  'transactions-purged',
  'transaction-restored',
  'transactions-viewed',
  'transactions-bulk-edited',
  'transactions-combined-outcome',
  'transactions-combined-income',
  'transactions-merged-transfer',
  'account-in-balance-set',
  'reminder-set',
  'reminder-deleted',
  'data-restored',
] as const

export type TCommandVerb = (typeof commandVerbs)[number]

/**
 * The id keeps the label pointing at the entity after a rename; the name is a
 * snapshot taken when the command was issued, so a deleted entity still
 * renders under the name it had instead of a dangling lookup.
 */
export type TCommandLabelArgs = {
  id?: string
  name?: string
}

export type TCommandLabel = {
  verb: TCommandVerb
  args?: TCommandLabelArgs
}

const verbSet = new Set<string>(commandVerbs)

/**
 * Reads a label back from storage, returning `undefined` for anything this
 * version does not recognize.
 *
 * Dropping is the whole point: a label is decoration over a durable command,
 * and a corrupt or newer-than-this-build one must never be the reason an
 * outbox fails to load and the user loses unsent work.
 */
export function sanitizeCommandLabel(
  value: unknown
): TCommandLabel | undefined {
  if (!isRecord(value) || !verbSet.has(value.verb as string)) return undefined
  const label: TCommandLabel = { verb: value.verb as TCommandVerb }
  const args = sanitizeArgs(value.args)
  if (args) label.args = args
  return label
}

function sanitizeArgs(value: unknown): TCommandLabelArgs | undefined {
  if (!isRecord(value)) return undefined
  const args: TCommandLabelArgs = {}
  if (typeof value.id === 'string') args.id = value.id
  if (typeof value.name === 'string') args.name = value.name
  return Object.keys(args).length ? args : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

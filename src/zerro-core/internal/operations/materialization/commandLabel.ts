/** Capture command labels before compiling away the intent. Labels never affect materialization or reach the server. */

export const commandVerbs = [
  'budget-set',
  'budget-goals-funded',
  'budget-overspending-covered',
  'budget-restarted',
  'budget-copied',
  'budget-goal-assigned',
  'budget-previous-assignment-set',
  'budget-funds-moved',
  'budget-surplus-released',
  'budget-average-spending-assigned',
  'budget-previous-spending-assigned',
  'budget-children-assigned',
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

/** Use the ID after rename and the captured name if the entity is later deleted. */
export type TCommandLabelArgs = {
  id?: string
  name?: string
}

export type TCommandLabel = {
  verb: TCommandVerb
  args?: TCommandLabelArgs
}

const verbSet = new Set<string>(commandVerbs)

/** Drop unknown labels without rejecting the durable command they describe. */
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

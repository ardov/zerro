import type { TCommandVerb } from 'zerro-core/replica'

/**
 * What each command verb is called in the `history` namespace.
 *
 * Exhaustive by construction: the verb union is closed in Core, so a verb
 * added there without a name here is a compile error rather than a blank row
 * in someone's history.
 */
export const commandVerbLabelKeys = {
  'budget-set': 'verb_budgetSet',
  'goal-set': 'verb_goalSet',
  'fx-rates-set': 'verb_fxRatesSet',
  'fx-rates-reset': 'verb_fxRatesReset',
  'settings-changed': 'verb_settingsChanged',
  'envelope-created': 'verb_envelopeCreated',
  'envelope-renamed': 'verb_envelopeRenamed',
  'envelope-color-set': 'verb_envelopeColorSet',
  'envelope-comment-set': 'verb_envelopeCommentSet',
  'envelope-structure-changed': 'verb_envelopeStructureChanged',
  'envelope-settings-changed': 'verb_envelopeSettingsChanged',
  'transaction-created': 'verb_transactionCreated',
  'transaction-edited': 'verb_transactionEdited',
  'transaction-recreated': 'verb_transactionRecreated',
  'transactions-deleted': 'verb_transactionsDeleted',
  'transactions-purged': 'verb_transactionsPurged',
  'transaction-restored': 'verb_transactionRestored',
  'transactions-viewed': 'verb_transactionsViewed',
  'transactions-bulk-edited': 'verb_transactionsBulkEdited',
  'transactions-combined-outcome': 'verb_transactionsCombinedOutcome',
  'transactions-combined-income': 'verb_transactionsCombinedIncome',
  'transactions-merged-transfer': 'verb_transactionsMergedTransfer',
  'account-in-balance-set': 'verb_accountInBalanceSet',
  'reminder-set': 'verb_reminderSet',
  'reminder-deleted': 'verb_reminderDeleted',
  'data-restored': 'verb_dataRestored',
} as const satisfies Record<TCommandVerb, string>

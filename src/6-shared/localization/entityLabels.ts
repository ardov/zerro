import type { TChangeSummaryKey } from 'zerro-core/replica'

/**
 * Display order for a change summary, and the `settings` namespace key that
 * names each type.
 *
 * Shared so the backup confirmation and the change history name the same
 * things the same way — a user who reads "Операции 3" in one place should not
 * meet "Транзакции" in the other. A restore writes ZenMoney entities only, so
 * it simply never matches the Zerro-side keys.
 */
export const entityLabelKeys = [
  ['transaction', 'entity_transaction'],
  ['envelope-budget', 'entity_envelopeBudget'],
  ['goal', 'entity_goal'],
  ['account', 'entity_account'],
  ['tag', 'entity_tag'],
  ['merchant', 'entity_merchant'],
  ['envelope-meta', 'entity_envelopeMeta'],
  ['tag-order', 'entity_tagOrder'],
  ['linked-accounts', 'entity_linkedAccounts'],
  ['linked-debtors', 'entity_linkedDebtors'],
  ['fx-rates', 'entity_fxRates'],
  ['user-settings', 'entity_zerroSettings'],
  ['user', 'entity_userSettings'],
  ['budget', 'entity_budget'],
  ['reminder', 'entity_reminder'],
  ['reminderMarker', 'entity_reminderMarker'],
  // Reference data only a server pull can change, so it never appears in a
  // restore summary and sits last in a journal one.
  ['instrument', 'entity_instrument'],
  ['country', 'entity_country'],
  ['company', 'entity_company'],
] as const satisfies readonly (readonly [TChangeSummaryKey, string])[]

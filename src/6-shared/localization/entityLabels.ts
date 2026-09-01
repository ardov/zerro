import type { TChangeSummaryKey } from '@/zerro-core/replica'

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

/**
 * Widens a summary to the whole display order so it can be indexed by any key
 * in the list. Producers emit different subsets — a restore never writes
 * reference data, a journal point never writes a preview count — and the keys
 * a given producer cannot emit are simply absent.
 */
export function byLabelKey<TCounts>(
  summary: Partial<Record<TChangeSummaryKey, TCounts>> | undefined
): Partial<Record<TChangeSummaryKey, TCounts>> {
  return summary ?? {}
}

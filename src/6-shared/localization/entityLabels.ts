import type { TDataEntityKey } from '6-shared/types'

/**
 * Display order for a per-entity change summary, and the `settings` namespace
 * key that names each type.
 *
 * Shared so the backup confirmation and the change history name the same
 * things the same way — a user who reads "Операции 3" in one place should not
 * meet "Транзакции" in the other.
 */
export const entityLabelKeys = [
  ['user', 'entity_userSettings'],
  ['account', 'entity_account'],
  ['tag', 'entity_tag'],
  ['merchant', 'entity_merchant'],
  ['budget', 'entity_budget'],
  ['reminder', 'entity_reminder'],
  ['reminderMarker', 'entity_reminderMarker'],
  ['transaction', 'entity_transaction'],
  // Reference data only a server pull can change, so it never appears in a
  // restore summary and sits last in a journal one.
  ['instrument', 'entity_instrument'],
  ['country', 'entity_country'],
  ['company', 'entity_company'],
] as const satisfies readonly (readonly [TDataEntityKey, string])[]

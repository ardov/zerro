export enum HiddenDataType {
  Goals = 'goals',
  FxRates = 'fxRates',
  Budgets = 'budgets',
  LinkedAccounts = 'linkedAccounts',
  LinkedDebtors = 'linkedDebtors',
  EnvelopeMeta = 'EnvelopeMeta',
  UserSettings = 'UserSettings',
  TagOrder = 'tagOrder',
}

export type THiddenDataComment<TPayload = unknown> = {
  type: HiddenDataType
  month?: string
  payload: TPayload
}

/** Report hidden reminder payloads by their Zerro entity type instead of counting every edit as a reminder. */
export const hiddenDataSummaryKeys = {
  [HiddenDataType.Goals]: 'goal',
  [HiddenDataType.Budgets]: 'envelope-budget',
  [HiddenDataType.EnvelopeMeta]: 'envelope-meta',
  [HiddenDataType.FxRates]: 'fx-rates',
  [HiddenDataType.TagOrder]: 'tag-order',
  [HiddenDataType.UserSettings]: 'user-settings',
  [HiddenDataType.LinkedAccounts]: 'linked-accounts',
  [HiddenDataType.LinkedDebtors]: 'linked-debtors',
} as const satisfies Record<HiddenDataType, string>

export type THiddenDataSummaryKey =
  (typeof hiddenDataSummaryKeys)[HiddenDataType]

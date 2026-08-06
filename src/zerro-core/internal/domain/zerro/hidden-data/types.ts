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

/**
 * Stable names for what a hidden-data payload holds, used wherever a change
 * is reported to the user.
 *
 * These payloads are not ZenMoney entities — they are JSON inside a reminder's
 * comment — so without a name of their own every budget, goal and envelope
 * setting is reported as a changed reminder, which is true about the row and
 * useless about the act.
 */
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

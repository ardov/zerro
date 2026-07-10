/**
 * Human-readable dependency map for the memoized session read nodes.
 *
 * It is intentionally descriptive rather than a runtime graph framework.
 * Snapshot sessions and Redux selectors keep their own memoization strategies;
 * this map makes the shared calculation boundaries reviewable in one place.
 * Raw snapshot fields, context, and adapter inputs are leaves and are omitted.
 */
export const readDependencies = {
  currentDate: [],
  currentMonth: [],
  userSettings: [],
  envelopeMeta: [],
  envBudgets: [],
  rawGoals: [],
  storedFxRates: [],
  debtAccountId: [],
  instrumentCodeById: [],
  transactionsHistory: [],
  tagStructure: [],
  inBudgetAccountIds: [],
  currentFxRates: ['currentMonth'],
  fxRates: ['storedFxRates', 'currentFxRates'],
  fxRatesGetter: ['fxRates', 'currentFxRates'],
  convertFx: ['fxRatesGetter'],
  debtors: ['transactionsHistory', 'debtAccountId'],
  envelopesCompiled: ['debtors', 'tagStructure', 'envelopeMeta'],
  envelopes: ['envelopesCompiled'],
  envelopeStructure: ['envelopesCompiled'],
  keepingEnvelopeIds: ['envelopes'],
  budgets: ['envBudgets', 'userSettings'],
  monthList: ['transactionsHistory', 'budgets', 'currentMonth'],
  currentFunds: ['inBudgetAccountIds', 'instrumentCodeById'],
  rawActivity: [
    'transactionsHistory',
    'inBudgetAccountIds',
    'debtAccountId',
    'debtors',
  ],
  activity: ['rawActivity', 'keepingEnvelopeIds'],
  envMetrics: ['monthList', 'envelopes', 'activity', 'budgets', 'convertFx'],
  sortedActivity: ['rawActivity', 'keepingEnvelopeIds', 'convertFx'],
  monthTotals: [
    'monthList',
    'currentFunds',
    'activity',
    'envMetrics',
    'convertFx',
    'currentMonth',
  ],
  goals: ['rawGoals', 'monthList', 'envMetrics', 'sortedActivity', 'convertFx'],
  goalTotals: ['goals', 'convertFx'],
  balances: [
    'transactionsHistory',
    'debtors',
    'instrumentCodeById',
    'debtAccountId',
  ],
  historyStart: ['transactionsHistory', 'currentDate'],
  balancesByDate: ['balances', 'historyStart', 'currentDate'],
} as const

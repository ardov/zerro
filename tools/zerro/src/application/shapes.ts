/**
 * One-line descriptions for the fields of each `successShape` named in the
 * help manifest, keyed by dot-path. Looked up via `help --shape <name>` so
 * an agent can resolve an unfamiliar field without reading source.
 */
export type TShapeFields = Record<string, string>

export const successShapes: Record<string, TShapeFields> = {
  commandManifest: {
    commands: 'Array of command descriptors.',
    'commands[].name': 'Command name, e.g. "report activity".',
    'commands[].effect':
      '"none" (read-only), "local" (writes the local state file only), or "remote" (talks to ZenMoney).',
    'commands[].required':
      'Prerequisites for this command: either a plain string (an env var or positional argument, e.g. "ZM_TOKEN" or "month") or an option descriptor object (name/type/values/default/description) for a required flag.',
    'commands[].optional': 'Option descriptor objects for every optional flag.',
    'commands[].optional[].name': 'Flag as typed on the command line, e.g. "--limit".',
    'commands[].optional[].type':
      '"string", "integer", "boolean", or "enum".',
    'commands[].optional[].values': 'Allowed values. Present only when type is "enum".',
    'commands[].optional[].default': 'Value used when the flag is omitted, if any.',
    'commands[].optional[].description': 'What the flag does.',
    'commands[].example': 'A runnable example invocation.',
    'commands[].successShape':
      'Name to pass to `help --shape` for this command\'s response field docs.',
    'commands[].errors': 'Error codes this command can return in a failure response.',
    defaults: 'Server-wide defaults applied when a command omits an option.',
    'defaults.limit': 'Page size used when --limit is omitted.',
    'defaults.maximumLimit': 'Largest value --limit accepts.',
    guide: 'Orientation notes for using this CLI, worth reading once.',
    'guide.fieldReference': 'How to look up field docs for any successShape.',
    'guide.successShapes': 'Every valid name for help --shape <name>.',
    'guide.tableOutput': 'How to get a table instead of JSON.',
    'guide.quietOutput': 'How to get pure JSON on stdout, without the pnpm banner.',
    'guide.multiCurrency': 'Why most amounts are {CURRENCY: amount} vectors, and how to collapse one to a number.',
    'guide.warnings': 'What a top-level "warnings" array on a successful response means.',
    'guide.shellGotcha': 'A zsh/bash pipe that corrupts JSON containing transaction comments with newlines, and the fix.',
  },

  versionInfo: {
    version: 'zerro package version this CLI was built from.',
  },

  localStatus: {
    stateExists: 'Whether refresh has created a local state file yet.',
    endpoint: 'ZenMoney endpoint in use: "ru" or "app".',
    statePath: 'Absolute path to the local state file.',
    stateRevision:
      'Hash of the local state; changes whenever base data or the outbox changes.',
    baseServerTimestampMs:
      'ZenMoney server timestamp the local snapshot is synced through.',
    accountCount: 'Number of accounts in the local snapshot.',
    transactionCount: 'Number of transactions in the local snapshot.',
    pendingCommandCount:
      'Number of staged commands waiting to be sent by sync.',
    lastCommandIssuedAt:
      'ISO timestamp of the most recently staged command, or null.',
    tokenAvailable: 'Whether ZM_TOKEN is available in the environment.',
  },

  refreshReceipt: {
    cursorMs: 'Server cursor sent to ZenMoney requesting changes since.',
    receivedServerTimestampMs:
      'New server timestamp after applying the refresh.',
    changed: 'Count of changed rows per entity type returned by ZenMoney.',
    pendingCommandCount:
      'Number of staged commands still waiting after refresh.',
  },

  syncReceipt: {
    sentOutboxCount: 'Number of staged commands sent to ZenMoney in this sync.',
    cursorMs: 'Server cursor sent to ZenMoney requesting changes since.',
    receivedServerTimestampMs: 'New server timestamp after applying the sync.',
    pendingCommandCount:
      'Number of staged commands still waiting after sync (0 on success).',
    noOp: 'True when the outbox was empty and nothing was sent.',
  },

  accountPage: {
    includeArchived: '--include-archived as passed (default false).',
    displayCurrency:
      'Currency code passed via --display-currency, or null if not requested.',
    items: 'Page of accounts, sorted by title.',
    'items[].id': 'Account id.',
    'items[].title': 'Account display name.',
    'items[].type': 'Account type: checking, cash, ccard, deposit, debt, etc.',
    'items[].archive': 'Whether the account is archived.',
    'items[].inBalance':
      "Whether the account counts toward the user's total balance — the same flag `totals.inBudget`/`totals.offBudget` split on.",
    'items[].balance': 'Last balance ZenMoney confirmed for this account.',
    'items[].hasPendingChanges':
      'True when a staged outbox command may have changed this balance locally before ZenMoney confirmed it.',
    'items[].instrument': "Account's currency: id, code, symbol.",
    'items[].balanceConverted':
      'items[].balance converted to one number in displayCurrency. Present only when --display-currency was given.',
    returned: 'Number of items in this page.',
    totalCount: 'Total number of rows matching the query, across all pages.',
    nextCursor: 'Opaque cursor for the next page, or null on the last page.',
    totals: 'Totals across every visible account, not just this page.',
    'totals.netWorth': 'Sum of every visible account balance, by currency.',
    'totals.inBudget':
      'Same sum restricted to accounts where inBalance is true.',
    'totals.offBudget':
      'Same sum restricted to accounts where inBalance is false (investments, trackers, etc.).',
    'totals.netWorthConverted':
      'totals.netWorth converted to one number in displayCurrency. Present only when --display-currency was given.',
    'totals.inBudgetConverted': 'totals.inBudget converted the same way.',
    'totals.offBudgetConverted': 'totals.offBudget converted the same way.',
  },

  tagPage: {
    items: 'Page of tags, sorted by title.',
    'items[].id': 'Tag id.',
    'items[].title': 'Tag display name.',
    'items[].parentId': 'Parent tag id, or null for a top-level tag.',
    'items[].icon': 'Icon identifier associated with the tag.',
    'items[].archive': 'Whether the tag is archived.',
    'items[].showIncome':
      'Whether this tag is offered when categorizing income.',
    'items[].showOutcome':
      'Whether this tag is offered when categorizing spending.',
    returned: 'Number of items in this page.',
    totalCount: 'Total number of rows matching the query, across all pages.',
    nextCursor: 'Opaque cursor for the next page, or null on the last page.',
  },

  merchantPage: {
    items: 'Page of merchants, sorted by title.',
    'items[].id': 'Merchant id.',
    'items[].title': 'Merchant display name.',
    returned: 'Number of items in this page.',
    totalCount: 'Total number of rows matching the query, across all pages.',
    nextCursor: 'Opaque cursor for the next page, or null on the last page.',
  },

  transactionPage: {
    displayCurrency:
      'Currency code passed via --display-currency, or null if not requested.',
    items: 'Page of transactions, newest first.',
    'items[].id': 'Transaction id.',
    'items[].date': 'Transaction date (YYYY-MM-DD).',
    'items[].type':
      '"income", "outcome", "transfer", "incomeDebt", or "outcomeDebt", derived from which accounts the amounts flow through — matches the values --type filters on ("debt" covers both incomeDebt and outcomeDebt).',
    'items[].income':
      'Income side: amount, account, instrument. Zero amount if none.',
    'items[].outcome':
      'Outcome side: amount, account, instrument. Zero amount if none.',
    'items[].tags': 'Tags applied to this transaction (up to 50).',
    'items[].tagCount': 'Total number of tags on this transaction.',
    'items[].merchant': 'Merchant reference, or null.',
    'items[].payee': 'Free-text payee name, or null.',
    'items[].comment': 'User comment, or null.',
    'items[].deleted': 'Whether ZenMoney marked this transaction deleted.',
    'items[].viewed':
      'Whether the user has viewed this transaction in ZenMoney.',
    returned: 'Number of items in this page.',
    totalCount: 'Total number of rows matching the query, across all pages.',
    nextCursor: 'Opaque cursor for the next page, or null on the last page.',
    totals: 'Totals across every matching transaction, not just this page.',
    'totals.income': 'Sum of items[].income.amount, by currency.',
    'totals.outcome': 'Sum of items[].outcome.amount, by currency.',
    'totals.transactionCount': 'Total matching transactions.',
    'totals.incomeConverted':
      'totals.income converted to one number in displayCurrency. Present only when --display-currency was given.',
    'totals.outcomeConverted': 'totals.outcome converted the same way.',
  },

  monthSummary: {
    month: 'Month this summary covers (YYYY-MM).',
    displayCurrency:
      'Currency code passed via --display-currency, or null if not requested.',
    totals:
      'Whole-month totals, each an amount-by-currency vector unless noted.',
    'totals.budgeted':
      'Sum of positive allocations across all root envelopes this month (the useful "how much did I budget" figure).',
    'totals.budgetedNet':
      'Same allocations netted against negative budgets on income envelopes; stays near zero even in a fully-budgeted month, so prefer `budgeted` for reporting.',
    'totals.undistributedIncome':
      'Balance still sitting in income envelopes (this month plus anything carried over) waiting to be allocated into spending envelopes.',
    'totals.toBeBudgeted':
      "Amount left to allocate after reserving next month's carryover need; negative means overallocated.",
    'totals.toBeBudgetedState':
      '"positive", "allocated", or "negative" — the sign of toBeBudgeted.',
    'totals.overspend':
      'Sum of negative available balances across envelopes (spending beyond what was budgeted).',
    'totals.fundsStart': 'Account balances at the start of the month.',
    'totals.fundsEnd': 'Account balances at the end of the month.',
    'totals.fundsChange': 'fundsEnd minus fundsStart.',
    'totals.transferFees':
      'Currency-exchange gain/loss from transfers between different-currency accounts.',
    'totals.generalIncome': 'Income not routed through any envelope.',
    'totals.envActivity':
      'Net spending/income recorded against envelopes this month.',
    'totals.available': 'Sum of available balances across all root envelopes.',
    'totals.freeFunds':
      "Account funds not currently claimed by any envelope's available balance.",
    'totals.budgetedInFuture':
      "Amount already committed to next month's carryover need.",
    totalsConverted:
      'Same fields as totals, each converted to one number in displayCurrency. Present only when --display-currency was given.',
    envelopes: 'Compact envelope-tree stats for the month.',
    'envelopes.envelopeCount': 'Total number of envelopes (including groups).',
    'envelopes.rootEnvelopeCount': 'Number of top-level envelopes.',
    'envelopes.budgetedEnvelopeCount':
      'Number of envelopes with a non-zero self budget this month.',
    'envelopes.transactionCount': 'Total transactions categorized this month.',
    'envelopes.budgeted': 'Same as totals.budgeted.',
    'envelopes.activity': 'Same as totals.envActivity.',
    'envelopes.available': 'Same as totals.available.',
    goals:
      'Goal progress totals for the month; zeroed defaults if no goals exist.',
    'goals.need': 'Amount still needed this month to stay on track for goals.',
    'goals.target': 'Total target amount across active goals.',
    'goals.progress': 'Aggregate progress ratio across active goals (0 to 1).',
    'goals.goalsCount': 'Number of active goals.',
    goalsConverted:
      'goals.need and goals.target converted to displayCurrency. Present only when --display-currency was given.',
  },

  monthPage: {
    displayCurrency:
      'Currency code passed via --display-currency, or null if not requested.',
    items:
      'Months in the requested range, oldest first. Each item has the same shape as monthSummary — run "help --shape monthSummary" for field meanings.',
    returned: 'Number of items in this page.',
    totalCount: 'Total number of months matching the range, across all pages.',
    nextCursor: 'Opaque cursor for the next page, or null on the last page.',
  },

  envelopePage: {
    displayCurrency:
      'Currency code passed via --display-currency, or null if not requested.',
    items: 'Page of envelopes, in envelope-tree order.',
    'items[].id': 'Envelope id, e.g. "tag#<uuid>" or "default:accounts".',
    'items[].name': 'Envelope display name.',
    'items[].type': 'Envelope kind, e.g. "tag".',
    'items[].group': 'Group label the envelope is organized under.',
    'items[].isRoot': 'True when this envelope has no parent.',
    'items[].parentId': 'Parent envelope id, or null for a root envelope.',
    'items[].childIds': 'Ids of direct children (up to 200).',
    'items[].childCount': 'Total number of direct children.',
    'items[].currency': "Envelope's currency.",
    'items[].visibility': 'Display visibility setting, e.g. "auto".',
    'items[].keepIncome':
      'When true, income categorized on this envelope stays here (net against its spending) instead of flowing to the month\'s general income. `report activity --direction net` uses this exact flag to decide whether a refund offsets spending or counts as separate income.',
    'items[].self': "This envelope's own metrics, excluding children.",
    'items[].self.budgetByCurrency':
      'Amount budgeted directly on this envelope.',
    'items[].self.activityByCurrency':
      'Spending/income recorded directly on this envelope.',
    'items[].self.availableByCurrency':
      "This envelope's own available balance.",
    'items[].self.transactionCount':
      'Transactions categorized directly on this envelope.',
    'items[].self.converted':
      'self.budgetByCurrency/activityByCurrency/availableByCurrency each converted to one number in displayCurrency. Present only when --display-currency was given.',
    'items[].withChildren':
      'Rolled-up metrics including all descendant envelopes.',
    'items[].withChildren.budgetByCurrency':
      'Budget summed across this envelope and its children.',
    'items[].withChildren.activityByCurrency':
      'Activity summed across this envelope and its children.',
    'items[].withChildren.availableByCurrency':
      'Available balance summed across this envelope and its children.',
    'items[].withChildren.transactionCount':
      'Transactions summed across this envelope and its children.',
    'items[].withChildren.converted':
      'withChildren fields each converted to one number in displayCurrency. Present only when --display-currency was given.',
    returned: 'Number of items in this page.',
    totalCount: 'Total number of rows matching the query, across all pages.',
    nextCursor: 'Opaque cursor for the next page, or null on the last page.',
  },

  envelope: {
    id: 'Envelope id, e.g. "tag#<uuid>" or "default:accounts".',
    name: 'Envelope display name.',
    type: 'Envelope kind, e.g. "tag".',
    group: 'Group label the envelope is organized under.',
    isRoot: 'True when this envelope has no parent.',
    parentId: 'Parent envelope id, or null for a root envelope.',
    childIds: 'Ids of direct children (up to 200).',
    childCount: 'Total number of direct children.',
    currency: "Envelope's currency.",
    visibility: 'Display visibility setting, e.g. "auto".',
    keepIncome:
      'When true, income categorized on this envelope stays here (net against its spending) instead of flowing to the month\'s general income. `report activity --direction net` uses this exact flag to decide whether a refund offsets spending or counts as separate income.',
    self: "This envelope's own metrics, excluding children.",
    withChildren: 'Rolled-up metrics including all descendant envelopes.',
  },

  goalPage: {
    displayCurrency:
      'Currency code passed via --display-currency, or null if not requested.',
    items: 'Page of active goals, sorted by envelope id.',
    'items[].envelopeId': 'Envelope this goal belongs to.',
    'items[].envelopeName': 'Display name of that envelope.',
    'items[].month': 'Month this goal row applies to.',
    'items[].currency': "Goal's currency.",
    'items[].goal': 'Configured goal amount.',
    'items[].progress': 'Progress ratio toward the goal (0 to 1).',
    'items[].needNow': 'Amount still needed this month to stay on track.',
    'items[].needStart': 'Amount needed as of the start of the month.',
    'items[].targetBudget':
      'Budget amount required this month to hit the goal.',
    totals: 'Aggregate goal totals for the month.',
    'totals.need': 'Amount still needed across all goals, by currency.',
    'totals.target': 'Total target amount across all goals, by currency.',
    'totals.progress': 'Aggregate progress ratio (0 to 1).',
    'totals.goalsCount': 'Number of active goals.',
    totalsConverted:
      'totals.need and totals.target converted to displayCurrency. Present only when --display-currency was given.',
    returned: 'Number of items in this page.',
    totalCount: 'Total number of rows matching the query, across all pages.',
    nextCursor: 'Opaque cursor for the next page, or null on the last page.',
  },

  debtorPage: {
    items: 'Page of debtors/creditors, sorted by name.',
    'items[].id': 'Debtor id, derived from the merchant or payee name.',
    'items[].name': 'Display name.',
    'items[].merchant': 'Linked merchant reference, or null.',
    'items[].payeeNames':
      'Free-text payee names seen for this debtor (up to 20).',
    'items[].payeeNameCount': 'Total distinct payee names seen.',
    'items[].transactionCount': 'Number of transactions with this debtor.',
    'items[].balance':
      'Outstanding balance by currency; positive means they owe the user.',
    returned: 'Number of items in this page.',
    totalCount: 'Total number of rows matching the query, across all pages.',
    nextCursor: 'Opaque cursor for the next page, or null on the last page.',
  },

  reportPage: {
    groupBy:
      '"tag", "merchant", "account", or "month" — the aggregation dimension.',
    direction:
      '"net" (default), "outcome", or "income" — see items[].total for what each computes. Scope is tag-routed activity only: transfers between accounts and debt movements never appear here (see `transactions search --type transfer|debt` and `debtors list` instead).',
    from: '--from as passed, or null.',
    to: '--to as passed, or null.',
    displayCurrency:
      'Currency code passed via --display-currency, or null if not requested.',
    items: 'Groups, sorted by descending absolute value, largest first.',
    'items[].key':
      'Group identifier: a tag/merchant/account id, a YYYY-MM month, or "none" when the transaction had no tag/merchant.',
    'items[].name': 'Display name for the group.',
    'items[].total':
      'Amount in this group, by currency. Sign depends on --direction: "outcome" and "income" are always positive (gross); "net" is positive when the group is a net spend and negative when it is a net inflow (e.g. a salary tag, or a group where refunds exceeded spending) — the mirror image of `month get`\'s `totals.envActivity` sign, chosen so an ordinary spending group reads as a plain positive number.',
    'items[].transactionCount': 'Number of transactions in this group.',
    'items[].totalConverted':
      'items[].total converted to one signed number in displayCurrency. Present only when --display-currency was given.',
    returned: 'Number of items in this page.',
    totalCount: 'Total number of groups matching the query, across all pages.',
    nextCursor: 'Opaque cursor for the next page, or null on the last page.',
    totals: 'Grand totals across every group, not just this page.',
    'totals.total': 'Total across all groups, by currency, same sign rules as items[].total.',
    'totals.transactionCount': 'Total transactions counted across all groups.',
    'totals.totalConverted':
      'totals.total converted to one signed number in displayCurrency. Present only when --display-currency was given.',
  },

  budgetPreview: {
    month: 'Month the preview applies to.',
    affected: 'One entry per requested envelope update, showing before/after.',
    'affected[].envelopeId': 'Envelope this update targets.',
    'affected[].envelopeName': 'Display name of that envelope.',
    'affected[].currency': 'Currency of the update.',
    'affected[].operation': '"set" or "clear".',
    'affected[].before':
      "Envelope's budget metrics before applying the update.",
    'affected[].after': "Envelope's budget metrics if the update were applied.",
  },

  budgetStageReceipt: {
    requestId: 'Idempotency key supplied by the caller.',
    idempotent:
      'True when this requestId was already used with the same input; the command was not reapplied.',
    receipt:
      'Stored result for this requestId, replayed verbatim on idempotent retries.',
    'receipt.outboxPosition': 'Position of the staged command in the outbox.',
    'receipt.affectedEnvelopeCount':
      'Number of envelopes updated by this command.',
    month: 'Month the update applies to. Absent on an idempotent replay.',
    affected:
      'One entry per updated envelope, showing before/after budget metrics. Absent on an idempotent replay.',
  },

  outboxPage: {
    items: 'Staged local commands not yet sent to ZenMoney, in outbox order.',
    'items[].position': '1-based position in the outbox.',
    'items[].issuedAt': 'ISO timestamp the command was staged.',
    'items[].summary':
      'Short label: "budget update", "transaction creation", etc.',
    'items[].touched':
      'Entity types and ids this command changes (up to 20 ids each).',
    returned: 'Number of items in this page.',
    totalCount: 'Total number of rows matching the query, across all pages.',
    nextCursor: 'Opaque cursor for the next page, or null on the last page.',
  },

  undoReceipt: {
    requestId: 'Idempotency key supplied by the caller.',
    idempotent:
      'True when this requestId was already used; the outbox was not modified again.',
    receipt:
      'Stored result for this requestId, replayed verbatim on idempotent retries.',
    'receipt.undoneOutboxPosition': 'Outbox position that was removed.',
    'receipt.remainingCommandCount':
      'Number of staged commands left in the outbox.',
    undone:
      'The outbox entry that was removed. Absent on an idempotent replay.',
  },

  transactionPreview: {
    before: 'Always null; preview-create never touches existing state.',
    after: 'The transaction as it would be created.',
    'after.id': 'Preview transaction id (not a real id; nothing was staged).',
    'after.kind': '"expense", "income", or "transfer".',
    'after.date': 'Transaction date (YYYY-MM-DD).',
    'after.income': 'Income side: amount, account, instrument.',
    'after.outcome': 'Outcome side: amount, account, instrument.',
    'after.tags': 'Tags that would be applied.',
    'after.tagCount': 'Number of tags that would be applied.',
    'after.merchant': 'Merchant reference, or null.',
    'after.payee': 'Free-text payee name, or null.',
    'after.comment': 'User comment, or null.',
    balancePendingCanonicalSync:
      'Always true: a preview is not staged, so account balances shown elsewhere have not moved yet.',
  },

  transactionStageReceipt: {
    requestId: 'Idempotency key supplied by the caller.',
    idempotent:
      'True when this requestId was already used with the same input; nothing new was staged.',
    receipt:
      'Stored result for this requestId, replayed verbatim on idempotent retries.',
    'receipt.transactionId': 'Id of the staged transaction.',
    'receipt.outboxPosition': 'Position of the staged command in the outbox.',
    before: 'Always null; transaction creation has no prior state to compare.',
    after: 'The transaction as staged, same shape as transactionPreview.after.',
  },
}

export function getShapeFields(name: string): TShapeFields | undefined {
  return successShapes[name]
}

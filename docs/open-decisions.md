# Open decisions — what needs the maintainer

- Updated: 2026-08-03
- Purpose: everything that is blocked on a judgement call rather than on
  implementation effort. One entry per decision, with enough context to answer
  it without re-reading the architecture documents.

## How to use this file

Each entry states the question, why it is open, the realistic options with
their consequences, and a recommendation. Answering an entry means:

1. writing the answer into
   [design-ledger.md](../src/zerro-core/support/documents/design-ledger.md) as a
   settled decision or an accepted risk;
2. deleting the entry here in the same commit.

Nothing in this file is scheduled work. An unanswered entry is not a bug, and
an entry that stays unanswered for months is itself an answer worth recording.

## 1. MCP inside a desktop host

**Question.** Should Zerro ship a desktop application that embeds the app and
exposes an MCP server locally, so a user can point an agent at their finances
without ever handling a ZenMoney token by hand?

**Why it is open.** The CLI settled the agent-interface question for you, not
for users: it assumes a repository checkout, `pnpm`, and a token pasted into an
environment variable. A desktop host changes what MCP is for — it becomes the
distribution mechanism rather than a nicer schema. That is a product commitment
well beyond the current tooling track: a packaging and update pipeline, a
signed binary, token storage in the OS keychain, and a place where an agent's
write actions get confirmed.

**What would need answering before any code.**

- Which agents are actually being served — a local Claude Desktop-style client
  the user already runs, or one bundled into the app?
- Where does the token live, and what unlocks it? A keychain entry is the
  minimum, and it changes the current "one environment variable" decision.
- Does the desktop app own its own replica, or does it drive the browser one?
  Two writers against one ZenMoney account is the failure mode to avoid, and
  the CLI explicitly declared concurrency out of scope.
- Do agent writes stage into an outbox the user reviews, as the CLI does, or
  reach ZenMoney directly? Staging is what makes an agent mistake reversible.

**Recommendation.** Keep it as a product question, not a tooling wave. If it
goes ahead, the ordering that protects you is: desktop shell with token
storage first, MCP surface second, and the same preview/stage/sync split the
CLI already proved — an agent that can only stage cannot do damage a user
cannot undo.

**Where it is recorded.** design-ledger, _Settled decisions → Local tooling_,
and
[local-tooling.md](../src/zerro-core/support/documents/local-tooling.md#post-mvp-follow-ups).

## 2. Yandex Metrica is configured but never loaded

**Question.** Metrica stays as a base counter — but nothing in the build loads
it. Restore the loader, or drop the leftovers?

**Why it is open.** `REACT_APP_YMID` lives in the Vercel environment, which is
why the line is commented out in `.env.production`. The variable, however, is
only read by a `ymid` export in `src/6-shared/config.ts` that no module
imports. The inline counter snippet left `public/index.html` in 2019 and the
`window.ym` call went with the GA4 migration, so the deployed build contains no
Metrica script at all. Whatever the Vercel variable is set to, the counter is
not collecting.

**Options.**

- _Restore the loader._ A small init beside `initAnalytics()` that injects the
  tag when `ymid` is present, page views only, no product events. Metrica
  genuinely resumes.
- _Drop the remnants._ Delete the `ymid` export and the commented variable, and
  accept GA4 as the only measurement.

**Recommendation.** Restore it if you look at Metrica reports; the current
state is the worst of both, because the deployment claims a counter that does
not exist.

**Where it is recorded.** [analytics.md](./analytics.md).

## 3. Analytics administration in the GA4 property

**Question.** The typed event layer ships and sends events; the property side
was never finished. Which of it do you actually want?

**Why it is open.** These are console tasks in Google Analytics, not source
changes, so no amount of implementation work closes them.

**What is waiting.**

- Registering custom dimensions for event properties. Without this, properties
  arrive but cannot be used as report dimensions.
- Building the reports or funnels the events were designed to answer.
- Verifying live payloads once in GA4 DebugView, which is the only check that
  the deployed measurement id is really a GA4 one.
- Deciding a consent policy: analytics currently initializes in production
  without asking. Whether that is acceptable depends on your audience, and the
  answer changes whether a consent gate is needed before `initAnalytics()`.

**Also decide:** `setAnalyticsUser()` sends the ZenMoney user id as the GA
`user_id`, which enables cross-session analysis of an identifiable account. Keep
it, or drop to anonymous measurement?

**Recommendation.** Do the DebugView check once — it is fifteen minutes and it
is the only item that can reveal the whole pipeline is misconfigured. Treat the
rest as optional.

**Where it is recorded.** [analytics.md](./analytics.md).

## 4. Publishing zerro-core

**Question.** Does anything justify publishing `zerro-core` to npm or moving it
into a real package directory?

**Why it is open.** The local CLI was the test of whether the source boundary
holds without a package, and it passed: the tool consumes `zerro-core/headless`
with no internal imports. So publishing is currently a cost with no consumer —
an `exports` policy, a versioning contract, and supported subpaths to maintain.

**Recommendation.** No, until a second consumer outside this repository exists.
Revisit only with that consumer in hand.

**Where it is recorded.** design-ledger, _Open questions → Future surfaces_.

## 5. Retention budget for the change log

**Question.** How far back should the change history reach, and what does that
cost in browser storage?

**Initial answer (2026-08-02, revised 2026-08-07).** Keep the stricter of a
90-day window and a 100 MiB budget. The 50 MiB soft threshold was dropped with
the branch model: it existed only to signal that a compression codec was
needed, no codec was ever written, and a persisted field that reports a wish is
worse than no field. These defaults are still provisional; they can be tuned
after real-account measurements without changing the storage model.

The journal is the durable source of accepted server state: one linear line of
checkpoints and compact canonical transitions, rather than a second copy beside
a persisted base.

**Follow-up measurement.** From a loaded real account, record the serialized
size of one full checkpoint and compact transitions over normal activity. No
account mutation is required. `replicaStorage` already records `loadCurrent`,
`loadHistoricalState`, and `compactOneBatch` timings and byte counts on
`window.zerro.logs`. Use the result to tune the provisional age and byte
limits, not to decide whether the architecture is viable.

**Recommendation.** Ship with the provisional limits and measure later. If
transitions dominate, shorten the retained window or improve encoding before
changing the journal/source-of-truth architecture.

**Where it is recorded.** design-ledger, _Open questions → Change log
retention_, and
[notes.md](../src/zerro-core/support/documents/notes.md#4-change-history-and-restore).

## 6. Where replica policy lives

**Question.** `6-shared/api/replicaStorage.ts` is now the largest and most
opinionated file in the replica stack. Should it stay one module, or split into
a dumb IndexedDB adapter plus a policy layer that owns the decisions?

**Why it is open.** The move out of `zerro-core/runtime/persistence` was right
for the part that touches IndexedDB: a packageable core should not depend on a
browser database. But the retention policy, the choice between appending a
checkpoint and a transition, the domain validation on replay, and the
root-user resolution went along with it. `6-shared` is the lowest layer in the
app and the one every other layer may import, so it is the worst place to keep
rules that decide what the replica means. Today `commitCanonical` answers both
"what should be written" and "how is it written" in one function.

**Options.**

- Leave it. One file, one transaction boundary, nothing to keep in sync. The
  cost is that policy is reachable from anywhere and cannot be tested without
  a database.
- Split into an adapter in `6-shared/api` (open, get, put, cursor, transaction)
  and a policy module that decides checkpoint-vs-transition and retention. The
  policy becomes testable without IndexedDB, but the atomic transaction has to
  span both, which is the thing most likely to be got wrong.
- Push the policy back into `zerro-core` behind a storage port the app
  implements. Best separation and it keeps the core packageable, but it is the
  largest change and adds an interface that exists only for one implementation.

**Recommendation.** Leave it for now and revisit if a second consumer appears —
a multi-account UI or the CLI wanting the same replica would be the real
forcing function. The single-transaction guarantee is worth more today than
the layering purity, and the file is coherent even if it is misplaced. Record
the trade-off rather than pretending the layer is clean.

**Where it is recorded.** Not yet settled; architecture.md describes the
current shape without judging it.

## 7. What writes a checkpoint during ordinary use

**Question.** Checkpoints are written only by a full sync, by recovery, and by
retention. Retention fires only past 90 days or 100 MiB, so during ordinary use
nothing advances `latestCheckpointSequence`. Should the runtime write one on a
schedule — every N entries or M bytes since the last?

**Why it is open.** Startup replays the whole suffix after the latest
checkpoint, so its cost grows with the number of syncs since the last full
reload, not with the size of the account. `applyCompactTransition` copies each
entity map it touches, so replaying a suffix that keeps touching transactions
costs roughly the suffix length times the transaction count. The same applies
to opening a history point far from its nearest checkpoint.

**Answer (2026-08-08).** No automatic periodic checkpoint. The manual full
reload in the settings menu is the supported lever, and it is deliberately the
_only_ manual one: it downloads a complete server state, appends a `full-sync`
checkpoint, and leaves the outbox queued. Until measurement shows a real
startup cost this is a scheduler nobody has evidence to tune, and every
automatic threshold is another number to get wrong.

**Follow-up measurement.** `window.zerro.logs.loadCurrent` already records
`entriesRead` and `duration` per startup. If entries read at startup climb into
the hundreds on a real account, revisit — the fix is one condition in
`replicaPersistence`'s `checkpointReason`, not a change to the storage model.

**Where it is recorded.** Here, plus the `ReloadDataItem` comment in
`SettingsMenu.tsx`, which explains why that menu item is the checkpoint lever.

## Answered recently

Kept briefly so a returning session sees what changed, then deleted.

- **Visible undo/redo controls** (2026-08-03) — undo/redo surfaces on the sync
  button's right-click/long-press panel (⟲/⟳ over the live command list), not
  as separate toolbar buttons, and ships as part of the change-history redesign
  rather than alone. Recorded in design-ledger, _Change history and restore_.
  Implementation is
  [notes.md](../src/zerro-core/support/documents/notes.md#4-change-history-and-restore).

- **Fixtures for the materializer balance rule** (2026-07-31) — none are needed.
  The rule shipped from behavior probing had already established, and it performs
  no currency conversion: each side of a transaction is already in its own
  account's currency, so a cross-currency transfer expresses its rate as the pair
  of stored numbers, and a foreign original amount sits in `opIncome`/`opOutcome`
  which the rule excludes. Recorded in design-ledger, _Commands and
  materialization_.

- **Automatic sync** (2026-07-30) — pushing stays manual, because an automatic
  push clears the acknowledged prefix and destroys undo. Automatic sync becomes
  pull-only, the existing leave confirmation stays, and a restored non-empty
  outbox shows a notice after load. Implementation is
  [notes.md](../src/zerro-core/support/documents/notes.md) item 2.
- **Payee envelope rename** (2026-07-30) — renaming promotes the payee to a
  merchant: rename or create the merchant, then attach the matching
  transactions. Implementation is
  [notes.md](../src/zerro-core/support/documents/notes.md) item 3.
- **Core migration completion smoke** (2026-07-30) — run by the maintainer and
  passed; the completion gate in
  [testing.md](../src/zerro-core/support/documents/testing.md) is satisfied.

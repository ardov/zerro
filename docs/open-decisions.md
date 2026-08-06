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

**Initial answer (2026-08-02).** Start with a three-month maximum age, trigger
compaction/compression at 50 MiB, and enforce a 100 MiB hard journal budget.
These defaults are intentionally provisional; the journal can tune them after
real-account measurements without changing its storage model.

The journal is the durable source of accepted server state: one checkpoint plus
compact canonical transitions, rather than a second copy beside the persisted
base. The soft threshold controls when storage maintenance starts; the hard
budget controls the maximum retained history.

**Follow-up measurement.** From a loaded real account, record the serialized
size of one full checkpoint and compact transitions over normal activity. No
account mutation is required. Use the result to tune the provisional age and
byte limits, not to decide whether the architecture is viable.

**Recommendation.** Ship with the provisional limits and measure later. If
transitions dominate, shorten the retained window or improve encoding before
changing the journal/source-of-truth architecture.

**Where it is recorded.** design-ledger, _Open questions → Change log
retention_, and
[notes.md](../src/zerro-core/support/documents/notes.md#4-change-history-and-restore).

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

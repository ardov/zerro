# Open decisions — what needs the maintainer

- Updated: 2026-07-30
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

## 3. Fixtures for the materializer balance rule

**Question.** Which real ZenMoney responses become the fixtures for predicting
account balances after a transaction write?

**Why it is open.** Balances are the next materializer rule and the only
remaining one with a visibly wrong number today: after a transaction edit,
`account.balance` stays stale until the next sync, and the CLI refuses to
predict balances at all. Implementing the rule needs recorded server responses
for the cases where the prediction is not obvious, and only you can produce
them from a real account.

**What is needed.** A captured request/response pair for each of:

- a plain expense and income on one account;
- a same-instrument transfer between two accounts;
- a cross-instrument transfer, where the conversion rate decides the result;
- a deleted transaction that previously affected a balance;
- a debt transaction, which routes differently from a normal expense.

Use a throwaway or clearly marked test account; the fixtures land in the repo,
so they must not contain real balances you would not publish. Note that
`private-fixtures/` is git-ignored if you would rather keep the raw captures
local and commit only reduced ones.

**Recommendation.** Capture the first three; they cover the visible bug. The
deletion and debt cases can wait for their own checkpoint.

**Where it is recorded.** design-ledger, _Open questions → Materializer
evidence and versioning_, and
[materialization.md](../src/zerro-core/support/documents/materialization.md).

## 4. Analytics administration in the GA4 property

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

## 5. Publishing zerro-core

**Question.** Does anything justify publishing `zerro-core` to npm or moving it
into a real package directory?

**Why it is open.** The local CLI was the test of whether the source boundary
holds without a package, and it passed: the tool consumes `zerro-core/headless`
with no internal imports. So publishing is currently a cost with no consumer —
an `exports` policy, a versioning contract, and supported subpaths to maintain.

**Recommendation.** No, until a second consumer outside this repository exists.
Revisit only with that consumer in hand.

**Where it is recorded.** design-ledger, _Open questions → Future surfaces_.

## 6. Visible undo/redo controls

**Question.** Undo and redo work through keyboard shortcuts in the loaded app,
with no visible buttons. Should the UI expose them?

**Why it is open.** It is accepted as a product risk rather than an oversight:
a user who does not know the shortcut cannot discover that a mistaken edit is
reversible. Adding controls means deciding where they live on mobile, and what
they show when the outbox is empty.

This connects to the pull-only sync decision: once an outbox can survive for
hours, "there are unsynchronized changes" and "you can still undo them" become
the same piece of UI, and the pending-changes notice is the natural place for
undo to become visible.

**Recommendation.** Design it together with the pending-changes notice rather
than as a separate toolbar feature.

**Where it is recorded.** design-ledger, _Accepted product risks_.

## Answered recently

Kept briefly so a returning session sees what changed, then deleted.

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

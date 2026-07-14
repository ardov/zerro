# Analytics migration plan

- Status: implemented 2026-07-14
- Created: 2026-07-12
- Scope: product analytics, navigation measurement, provider adapters, and the
  boundary between analytics and diagnostics
- Current implementation: `src/6-shared/analytics`

## Implementation decision

Google Analytics 4 is now the only destination for typed product events.
Yandex Metrica remains enabled as a base counter through the external runtime
configuration, but the application no longer calls `reachGoal` or forwards
product events to it. `REACT_APP_YMID` remains part of the deployment contract.
The legacy Universal Analytics-shaped `react-ga` adapter and free-form
`sendEvent(string)` API were removed.

The typed catalog in `src/6-shared/analytics/events.ts` is the source of truth.
GA4 is loaded through the Google tag using `REACT_APP_GAID`; this deployment
value must be a GA4/Google tag id, not a Universal Analytics property id.
Product events use stable names and bounded properties, initial and subsequent
SPA page views are explicit, and provider failures cannot affect application
operations. Sentry remains the diagnostic destination for exceptions.

The remainder of this document preserves the reasoning and rollout checklist
that led to the implementation. Provider-baseline comparison, report setup,
custom-dimension registration, consent policy, and live DebugView verification
remain deployment/analytics-administration tasks rather than source changes.

## Purpose

Replace the current free-form `sendEvent(string)` convention with a small,
typed analytics layer that:

- records stable product events with explicit properties;
- emits an event at the boundary that owns its meaning;
- does not couple `zerro-core` domain or presentation code to analytics;
- separates product analytics from error and data-quality diagnostics;
- can send the same semantic event to different providers without forcing
  their data models to be identical;
- avoids personal financial data and uncontrolled cardinality;
- can be migrated in small, verifiable slices without silently breaking the
  existing reports and Yandex Metrica goals.

This document is a migration plan, not approval for a particular provider.
The provider inventory and reporting requirements must be confirmed before the
old integration is removed.

## Current state

The central helper currently accepts one string:

```ts
sendEvent('Transaction: mark viewed: true')
```

It treats the string in two different ways:

1. The complete string becomes a Yandex Metrica `reachGoal` identifier.
2. Splitting the string on `": "` produces the Google Analytics
   `category`, `action`, and `label` fields.

This produces several structural problems.

### Free-form and dynamic event names

Runtime values are embedded into event names, including language, goal type,
boolean state, tag color, quick-budget text, unknown icon names, and raw error
messages. The result is an unstable event catalog and, in some cases, an
unbounded number of event or goal identifiers.

Examples include:

```text
Settings: change language to en
Settings: emoji icons set to true
Goals: set monthly goal
Tag: set color: #abcdef
Tags: UnknownNames: <icon>
Error: <runtime message>
```

### Mixed ownership

Events are emitted from UI click handlers, feature thunks, sync infrastructure,
error boundaries, store helpers, and a Core Redux presentation helper. A future
caller cannot tell whether `sendEvent` means that a user expressed intent, a
command completed, or a technical condition was observed.

Transaction commands demonstrate the migration risk. The same semantic
operations are launched from a context menu, transaction preview, bulk toolbar,
and transaction list. Tracking each UI path independently makes omissions and
duplicates likely when a caller changes.

### Product analytics and diagnostics share one channel

Error boundaries already send exceptions to Sentry but also place the error
message in an analytics event name. Sync errors do the same. Unknown tag icons
are emitted from a presentation function that may run repeatedly while
rendering or recomputing state.

These signals have a different lifecycle, privacy profile, and owner from
product analytics. They should not share an event API.

### Provider uncertainty

The project uses `react-ga`, which implements the Universal Analytics event
model. Before migration, verify whether the configured property still receives
useful data, whether a GA4 property already exists, and which reports are still
used.

Yandex Metrica receives every event as `reachGoal`. This must be checked against
the configured goals: not every product event should necessarily be an
advertising/conversion goal.

### Lifecycle gaps

- Route tracking registers a history listener but does not explicitly record
  the initial route.
- A numeric application user id is assigned to Google Analytics, but the
  required privacy policy, consent behavior, pseudonymization, and logout reset
  are not documented.
- Most events are emitted before dispatch. Their names often sound like a
  completed action even when they technically measure an attempt.
- There is no catalog explaining which report or product question consumes an
  event.

## Target principles

### Measure a question, not a button

Every event must answer a stated product or operational question. If there is
no expected report, funnel, alert, or decision, do not add the event.

Good questions include:

- How many users successfully edit a transaction?
- Which entry points are used to delete transactions?
- How often does manual synchronization complete or fail?
- Which budget automation actions are adopted?

"There is a clickable element" is not by itself a reason to track it.

### Stable name, variable properties

Event names use lower-case `snake_case`, describe a completed fact where
possible, and never contain runtime data:

```ts
track('setting_changed', {
  setting: 'language',
  value: 'en',
  source: 'settings_menu',
})
```

Names should normally use `object_action`, for example:

```text
transaction_details_viewed
transaction_deleted
transaction_restored
transaction_edited
transaction_viewed_changed
transaction_tags_changed
transactions_combined
budget_funds_moved
budget_automation_applied
budget_goal_changed
setting_changed
data_export_completed
sync_completed
external_link_opened
```

Do not encode application-layer categories into names solely to recreate the
old Universal Analytics `category/action/label` schema.

### Emit at the boundary that owns the fact

Use the following placement rules.

| What is measured                           | Preferred location                                               | Example                                                |
| ------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------ |
| UI interaction itself                      | UI handler                                                       | details opened, external link followed, flow cancelled |
| Successful product action                  | feature/application orchestration after validation or completion | transaction deleted, budget moved                      |
| Attempt in an important failure-prone flow | feature/application orchestration before execution               | export requested, sync requested                       |
| Technical outcome                          | infrastructure orchestration                                     | sync completed or failed                               |
| Exception or data-quality defect           | Sentry/diagnostic adapter                                        | render error, unknown tag icon                         |

Do not emit product analytics from reducers, selectors, projectors, render
helpers, pure Core commands, materializers, or low-level transport methods.

The `zerro-core` rule is strict: domain, application, infrastructure, and
presentation code must remain analytics-free. The app-facing orchestration or
UI adapter may track a semantic action after invoking Core.

### Distinguish intent, success, and failure deliberately

Do not automatically create three events for every operation. Use a single
successful fact for reliable local commands. Add attempt and failure events
only when conversion or failure analysis matters.

Examples:

- Transaction delete is a synchronous validated command: emit
  `transaction_deleted` once after command dispatch succeeds.
- Sync is remote and failure-prone: emit `sync_requested`, then exactly one of
  `sync_completed` or `sync_failed`.
- External navigation is the intended action: emit `external_link_opened` in
  the click handler immediately before navigation.

Event names and their documented semantics must agree. An event named
`*_completed` may not be emitted before the operation.

### Keep source separate from action

Different UI entry points must normally share one semantic event and identify
their origin with a bounded `source` property:

```ts
track('transaction_deleted', {
  mode: 'single',
  source: 'context_menu',
})
```

Allowed values are unions in code, not arbitrary component names. Refactoring a
component must not rename historical analytics dimensions.

### Collect the minimum data

Product analytics must not include:

- transaction, account, envelope, merchant, user, or tag database ids;
- comments, titles, payees, tag names, error messages, URLs with query data, or
  other user-provided strings;
- exact transaction amounts, balances, income, expenses, goal amounts, or
  exchange-rate values unless a separately reviewed product requirement
  justifies them;
- raw stack traces or serialized application state;
- tag colors or icon names as event names.

Prefer bounded properties, booleans, counts, and coarse buckets. For example,
`selection_size: '2_5'` is safer and more reportable than an array of ids.

### Product analytics must not affect the product operation

Provider failure must never make a command, navigation, export, or sync fail.
The public tracking API returns `void`, catches provider errors, and may report
adapter failure through a rate-limited diagnostic path. It must not retry in a
way that duplicates product events without an explicit event-id strategy.

## Target module

Create a dedicated app-level module, initially under:

```text
src/6-shared/analytics/
  index.ts             public app API
  events.ts            event/property catalog
  analytics.ts         fan-out and runtime guards
  providers/
    console.ts         development/debug provider
    ga4.ts              GA4 adapter, if approved
    metrica.ts          Metrica event/goal adapter
  analytics.test.ts
```

`6-shared/analytics` is application infrastructure, not a `zerro-core` API.
Core must never import it.

### Typed event catalog

Start with an explicit map instead of accepting arbitrary strings:

```ts
export type AnalyticsEventMap = {
  transaction_deleted: {
    mode: 'single' | 'bulk'
    source: 'context_menu' | 'preview' | 'bulk_toolbar'
    selection_size?: '1' | '2_5' | '6_20' | '21_plus'
  }
  transaction_viewed_changed: {
    viewed: boolean
    mode: 'single' | 'bulk'
    source: 'context_menu' | 'transaction_list' | 'bulk_toolbar'
  }
  setting_changed: {
    setting:
      | 'theme'
      | 'language'
      | 'auto_sync'
      | 'emoji_icons'
      | 'prefer_zenmoney_budgets'
      | 'display_currency'
    value: string | boolean
    source: 'settings_menu' | 'currency_selector'
  }
}

export function track<K extends keyof AnalyticsEventMap>(
  name: K,
  properties: AnalyticsEventMap[K]
): void
```

The initial implementation can use one map. If it becomes large, split maps by
feature and combine their types; do not introduce a generic `Record<string,
unknown>` public escape hatch.

### Common context

The analytics layer may append a small reviewed context to every event:

```ts
type AnalyticsContext = {
  app_version: string
  language: 'en' | 'ru' | 'other'
  route_name: RouteName
}
```

Do not add volatile Redux state to common context. Route names must be
normalized templates such as `transactions` or `budget`, never raw URLs.

### Provider mapping

Providers receive the semantic event but decide how to represent it:

```ts
type AnalyticsProvider = {
  track<K extends AnalyticsEventName>(
    name: K,
    properties: AnalyticsEventMap[K]
  ): void
  pageView(route: RouteName): void
  setUser(user: AnalyticsUser | null): void
}
```

For GA4, send the semantic name and properties directly, subject to its naming
and parameter constraints.

For Metrica, maintain an explicit mapping of the small subset that are actual
goals. Other product events should use the provider's ordinary event-parameter
mechanism if it is needed and configured, or be omitted from that provider.
Never infer a goal identifier from arbitrary event text.

```ts
const metricaGoals = {
  data_export_completed: 'data_export_completed',
  external_link_opened: 'external_link_opened',
} satisfies Partial<Record<AnalyticsEventName, string>>
```

### Development behavior

Development builds should log a structured object:

```text
[analytics] transaction_deleted
{ mode: "single", source: "preview" }
```

Provide an opt-in debug mode for staging/production verification. Do not rely on
production-only code paths that cannot be exercised before release.

## Proposed event catalog and migration mapping

This is the starting catalog. Final inclusion depends on an owner and a report
or product question for each event.

| Current event family              | Proposed event                                     | Key properties                                                            | Preferred owner                                                 |
| --------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `Transaction: see details`        | `transaction_details_viewed`                       | `source`                                                                  | UI, because opening the view is the fact                        |
| `Transaction: delete`             | `transaction_deleted`                              | `mode`, `source`, optional size bucket                                    | shared transaction action orchestration                         |
| `Transaction: delete permanently` | `transaction_deleted_permanently`                  | `source`                                                                  | shared transaction action orchestration                         |
| `Transaction: restore`            | `transaction_restored`                             | `source`                                                                  | shared transaction action orchestration                         |
| `Transaction: edit`               | `transaction_edited`                               | `source`, bounded `changed_fields` if useful                              | edit/save orchestration after a real change                     |
| `Transaction: recreate`           | `transaction_recreated`                            | `source`                                                                  | recreate orchestration after receipt                            |
| `Transaction: mark viewed: *`     | `transaction_viewed_changed`                       | `viewed`, `mode`, `source`                                                | shared transaction action orchestration                         |
| `Transaction: mark older viewed`  | `transactions_older_marked_viewed`                 | size bucket                                                               | list feature after ids are known and command succeeds           |
| `Transaction: select similar`     | `similar_transactions_selected`                    | `criterion`, size bucket if useful                                        | list UI/feature after selection is applied                      |
| combine/merge events              | `transactions_combined`                            | `result_type`, `source`, size bucket                                      | bulk operation orchestration                                    |
| `Bulk Actions: set new tags`      | `transaction_tags_changed`                         | `mode: bulk`, `tag_action`, size bucket                                   | bulk edit apply orchestration                                   |
| `Accounts: Set in budget`         | `account_budget_membership_changed`                | `in_budget`, `source`                                                     | account context action after dispatch                           |
| `Budgets: move funds`             | `budget_funds_moved`                               | source/destination kinds, cross-currency boolean                          | move-money feature after validation and dispatch                |
| start/copy/fill/fix events        | `budget_automation_applied`                        | `automation`, affected-count bucket                                       | each bulk feature after successful calculation/dispatch         |
| `Budgets: quick budget: *`        | `budget_quick_amount_selected`                     | stable `preset`, `source`                                                 | quick-action UI after selection                                 |
| goal set/delete                   | `budget_goal_changed`                              | `operation`, `goal_type`                                                  | goal save/remove orchestration                                  |
| `Tag: set color: *`               | `envelope_color_changed`                           | no exact color; optional `source`                                         | color save orchestration                                        |
| settings toggles/language         | `setting_changed`                                  | `setting`, bounded `value`, `source`                                      | setting owner after local state update succeeds                 |
| display currency                  | `setting_changed`                                  | `setting: display_currency`; consider only `set/unset`, not currency code | display-currency action                                         |
| CSV/JSON export                   | `data_export_requested/completed/failed`           | `format`, safe failure class                                              | export orchestration; only retain all three if funnel is useful |
| reload data                       | `local_data_reload_confirmed`                      | `source`                                                                  | confirmed destructive action, not initial click                 |
| convert old budgets               | `legacy_budgets_converted`                         | affected-count bucket                                                     | conversion orchestration after completion                       |
| logout                            | `logout`                                           | `source`                                                                  | authentication orchestration; clear analytics user afterward    |
| review links/settings             | `external_link_opened` or `review_action_selected` | stable `destination`, `source`                                            | click handler                                                   |
| sync success/error                | `sync_requested`, `sync_completed`, `sync_failed`  | `mode`, duration bucket, safe failure class                               | sync orchestration                                              |
| error boundaries                  | no product event by default                        | Sentry tags: boundary and route                                           | diagnostic adapter                                              |
| unknown tag icon                  | no product event                                   | rate-limited Sentry message or development warning                        | diagnostic adapter outside render/projector path                |

Properties in this table are candidates, not permission to collect all of them.
Keep only fields used in a named report.

## Migration phases

Each phase should be independently reviewable and releasable. Do not convert all
call sites in one change.

### Phase 0: inventory providers, reports, privacy, and baselines

Before changing event delivery:

1. Confirm the deployed values and property types behind `REACT_APP_GAID` and
   `REACT_APP_YMID` without writing secrets into the repository.
2. Confirm whether Google receives new events and whether the target is
   Universal Analytics or GA4.
3. Export or record the currently used reports, dashboards, audiences, and
   Metrica goals.
4. Identify the owner and product question for every event that must survive.
5. Record a short baseline for event volumes and important conversion counts so
   the new pipeline can be compared after release.
6. Decide whether analytics requires consent in supported jurisdictions and
   document initialization behavior before/after consent.
7. Decide whether a user id is required. If it is, define pseudonymization,
   provider policy, logout reset, and deletion behavior.

Deliverable: an approved analytics catalog containing event name, description,
trigger, properties, owner, destination providers, consuming report, privacy
classification, and retention requirement.

Exit criteria:

- the active providers and goal identifiers are known;
- no event is marked "must preserve" without a report or product question;
- privacy and user-id decisions are explicit;
- the legacy baseline is saved outside source code or documented without
  secrets.

### Phase 1: introduce the typed facade without changing semantics

1. Add `6-shared/analytics` with typed `track`, `pageView`, and `setUser` APIs.
2. Add console, legacy `react-ga`, and Metrica adapters behind that facade.
3. Implement runtime error isolation so provider failures cannot escape.
4. Add a temporary legacy mapping table for the first migrated event family.
5. Add structured development logging.
6. Add unit tests for fan-out, disabled providers, provider exceptions, and
   exact event/property forwarding.

Do not expose both `track` and a public untyped `sendEvent` from the new module.
The old helper may remain temporarily for untouched callers.

Exit criteria:

- the facade can run alongside the legacy helper;
- provider failure does not affect the caller;
- no `zerro-core` code imports the facade;
- types reject unknown names and invalid property values.

### Phase 2: remove diagnostics from product analytics

This is the lowest-risk, highest-value cleanup.

1. Remove raw error-message events from both error boundaries and sync failure
   handling.
2. Keep exceptions in Sentry and add only bounded tags such as `boundary`,
   normalized route, sync phase, and safe error class.
3. Remove `sendEvent` from `zerro-core/redux/tagPresentation.ts`.
4. If unknown icon visibility is useful, report it once per icon per session
   through a rate-limited diagnostic adapter outside the projector/render path.
5. Add tests proving presentation helpers are pure and repeated rendering does
   not generate telemetry.

Exit criteria:

- no raw exception message enters product analytics;
- no product analytics is emitted from `zerro-core`, selectors, or render
  helpers;
- diagnostics remain observable through Sentry or development logs.

### Phase 3: migrate one transaction vertical slice

Transactions are the best first product slice because the same operations have
several UI entry points and expose the ownership problem clearly.

Start with delete, restore, and viewed-state changes:

1. Define their names, property unions, and source values in the catalog.
2. Introduce narrow app-level action functions/hooks that invoke the Core Redux
   command and then emit the semantic event exactly once.
3. Pass `source` from context menu, preview, list, or bulk toolbar.
4. Replace tracking in each caller; do not put analytics into the Core Redux
   command.
5. Verify that confirmation cancellation emits no deletion event.
6. Verify single and bulk paths, including one event for a bulk operation rather
   than one event per transaction.
7. Add call-site tests for event timing and exact-once behavior.
8. Compare staging/provider output with the legacy baseline and mapping.

Then migrate edit, recreate, tag changes, combine, merge, details view, similar
selection, and older-viewed actions as separate small changes.

Exit criteria:

- every migrated operation has one documented semantic owner;
- all entry points produce the same event name with distinct bounded sources;
- no migrated caller still invokes `sendEvent`;
- event counts do not multiply with selection size or render count.

### Phase 4: migrate remaining feature families

Proceed family by family:

1. Budget movement and budget automations.
2. Goal changes and quick-budget presets.
3. Account budget membership and display currency.
4. Settings, exports, conversion, reload, and logout.
5. Review/external navigation events.
6. Sync lifecycle and page views.

For each family:

- write or approve its catalog rows first;
- choose the semantic owner and event timing;
- replace dynamic names with properties;
- add focused exact-once tests;
- verify provider payloads in debug/staging;
- remove its old `sendEvent` calls before starting another family.

For page views, explicitly emit the initial normalized route and subsequent
route changes. Verify redirects so a single navigation does not create both an
intermediate and final business page view unless that is intentional.

For logout, send the event before navigation if delivery requires it, then clear
provider user identity. Test login as another user in the same browser session.

### Phase 5: modernize providers

Do this only after Phase 0 confirms the required destinations.

Google path:

1. Provision or confirm a GA4 property and web stream.
2. Replace `react-ga` with the approved GA4 integration.
3. Map typed names and parameters directly.
4. Register only the custom dimensions/metrics actually required by reports.
5. Verify initial page view, route changes, user/session behavior, DebugView,
   and production Realtime data.
6. Rebuild required reports and compare them with the migration baseline.
7. Remove the Universal Analytics adapter and dependency.

Metrica path:

1. Keep an explicit allowlist of conversion goals.
2. Map semantic events to the configured goal ids.
3. Pass only approved bounded parameters.
4. Verify each goal with Metrica debugging tools.
5. Confirm that non-goal product events are intentionally sent through another
   supported mechanism or intentionally omitted.

If dual-writing old and new provider schemas is required, give it a fixed
release window. Dual writing must have tests and a documented removal date; it
must not become a permanent compatibility layer.

### Phase 6: remove legacy tracking

1. Verify `rg "sendEvent" src` finds no production callers.
2. Delete `sendEvent`, string splitting, and the old provider initialization.
3. Remove `react-ga` after GA4 or the chosen replacement is confirmed live.
4. Remove temporary legacy mappings and dual-writing code.
5. Update the analytics catalog to `active` status and assign an owner.
6. Add a pull-request checklist item for new or changed analytics events.

Exit criteria:

- every production event is declared in the typed catalog;
- every event has one semantic description and one owner;
- providers receive no free-form event names or properties;
- analytics has no runtime dependency from `zerro-core`;
- initial and subsequent page views are verified;
- user identity is set and cleared according to the recorded policy;
- legacy dashboards/goals are migrated or explicitly retired.

## Verification strategy

### Static and unit checks

Add tests for:

- unknown event names and invalid property values at type-check time;
- stable provider mapping;
- provider-disabled behavior;
- provider exceptions being swallowed and diagnosed safely;
- removal of undefined properties before sending;
- event and property naming constraints;
- bounded values for `source`, `operation`, `setting`, and similar dimensions;
- no direct analytics imports from `src/zerro-core`;
- no raw `Error.message`, ids, comments, titles, amounts, or state objects in
  known event payload builders.

The privacy test cannot prove absence of all sensitive data, but it can guard
the catalog and the highest-risk payload builders.

### Feature tests

For each migrated use case, verify:

- invalid/no-op actions emit nothing;
- cancelled confirmations emit nothing;
- successful actions emit exactly once;
- bulk actions emit one event with a size bucket;
- the event occurs after the state-changing command or successful asynchronous
  result, according to its contract;
- different UI entry points vary `source`, not the event name;
- analytics failure does not change the product result.

Do not assert analytics in pure Core command/compiler tests. Assert it in the
app orchestration tests that own the side effect.

### Provider verification

Before each rollout:

1. Inspect the structured development payload.
2. Inspect the provider's debug view on staging or an explicitly marked test
   property.
3. Confirm event names, parameters, page views, and absence of raw private data.
4. Release to a small audience if the deployment system supports it.
5. Compare counts and ratios with the saved baseline, accounting for the
   intentional semantic changes.
6. Monitor adapter errors and unexpected event-volume spikes.

## Analytics catalog template

Maintain the catalog as code for typing and optionally mirror this table in
documentation for product review:

| Field            | Meaning                                            |
| ---------------- | -------------------------------------------------- |
| Name             | Stable `snake_case` event name                     |
| Status           | proposed, active, deprecated, removed              |
| Product question | Decision/report the event supports                 |
| Semantics        | Exact fact represented by one event occurrence     |
| Trigger          | Precise success/intent/failure point               |
| Owner            | Feature/application boundary that emits it         |
| Properties       | Names, types, allowed values, and meaning          |
| Providers        | GA4, Metrica goal, or another approved destination |
| Report           | Dashboard, funnel, alert, or experiment using it   |
| Privacy          | Data classification and review notes               |
| Introduced       | Release or date                                    |
| Replaces         | Legacy event names and goal ids                    |

An event change is a schema change. Renaming a property or changing its meaning
requires deprecation/migration, not an unnoticed edit.

## Pull-request checklist

For a new or changed event:

- [ ] The event answers a documented product or operational question.
- [ ] Its name is stable and contains no runtime value.
- [ ] It is declared in the typed catalog.
- [ ] Properties are bounded and contain no private financial or user-provided
      data.
- [ ] The event is emitted at the boundary that owns the measured fact.
- [ ] Success, attempt, and failure semantics are explicit.
- [ ] Bulk behavior and exact-once behavior are tested.
- [ ] Provider mapping and required custom dimensions/goals are updated.
- [ ] Existing reports are migrated or the old schema is intentionally
      deprecated.
- [ ] Debug/staging payloads were inspected.

## Open decisions before implementation

1. Is Google Analytics currently receiving useful data, and is the configured
   id UA or GA4?
2. Which existing Metrica JavaScript goals are configured and actively used?
3. Which current reports, audiences, and advertising conversions must remain
   comparable?
4. Is GA4 the desired primary product analytics provider, or should the typed
   layer target another provider?
5. Is per-user cross-session analysis necessary? If yes, what pseudonymous id,
   consent, deletion, and logout-reset policy applies?
6. Should non-essential analytics initialize only after consent, and what is the
   expected behavior before a decision is stored?
7. Which exact financial-data aggregates, if any, are valuable enough to justify
   collection? The default is none.
8. Which sync failure classes are safe and actionable enough for product
   analytics rather than Sentry only?
9. Which current events have no consumer and should simply be deleted?

## Recommended starting slices

After Phase 0 answers the provider and compatibility questions, begin with
three deliberately small changes in this order.

### Slice 1: typed facade

1. Add the typed facade and console/legacy adapters.
2. Declare only `transaction_deleted`, `transaction_restored`, and
   `transaction_viewed_changed` as the first product event family.
3. Test provider isolation, mapping, and development output.
4. Do not migrate production call sites yet.

### Slice 2: diagnostics boundary

1. Remove product-analytics events containing raw error messages.
2. Remove analytics from `zerro-core/redux/tagPresentation.ts`.
3. Keep or replace the signals through bounded Sentry diagnostics.
4. Verify that presentation remains pure under repeated calls.

### Slice 3: first transaction vertical

1. Add one shared app-level orchestration boundary for delete, restore, and
   viewed-state actions.
2. Migrate context menu, preview, list, and bulk-toolbar callers.
3. Add exact-once, no-op, bulk, and cancellation tests.
4. Verify the three payloads in provider debug tools.

Only after those three slices should the catalog expand to the remaining
transaction and product-event families.

# Product analytics

- Status: active policy
- Updated: 2026-07-30
- Implementation: `src/6-shared/analytics`
- Catalog: `src/6-shared/analytics/events.ts` — the source of truth

The migration plan that produced this layer was completed on 2026-07-14 and
removed; its reasoning stays in Git.

## What exists today

Google Analytics 4 is the only destination for typed product events. The tag is
loaded from `REACT_APP_GAID`, which must be a GA4 measurement id. Events are
declared in a typed catalog, so a name or property that is not in
`AnalyticsEventMap` does not compile.

- `initAnalytics()` loads the tag once, in production only, with automatic page
  views disabled.
- `trackPageView(pathname)` sends every page view explicitly, including the
  first one.
- `track(name, properties)` sends one catalog event; outside production it logs
  to the console instead.
- `setAnalyticsUser(userId)` sets the GA `user_id` to the ZenMoney user id, and
  clears it on logout.
- A provider failure is caught and warned about; it can never change a product
  result.

Sentry is the destination for exceptions and diagnostics. Product analytics and
diagnostics do not share a channel.

## Yandex Metrica — configured but not loaded

Metrica stays as a base counter by decision: it receives no typed product
events, only page traffic. `REACT_APP_YMID` is commented out in
`.env.production` because production builds on Vercel take their environment
from Vercel, not from the repository file.

The counter is nevertheless not running. No source file loads it: the inline
snippet left `public/index.html` in 2019, the `window.ym` call went with the
GA4 migration, and `src/6-shared/config.ts` now exports a `ymid` that nothing
imports. Setting the variable in Vercel therefore changes nothing. Restoring
the loader is an open item in [open-decisions.md](./open-decisions.md).

## Rules for a new or changed event

- The event answers a documented product question. If no report or decision
  would use it, it does not exist.
- The name is stable, `snake_case`, and contains no runtime value. Variation
  belongs in properties — especially `source`, which distinguishes UI entry
  points without forking the name.
- Properties are bounded literal unions, never free-form strings, ids, titles,
  comments, or amounts. Financial data is not collected by default.
- The event is emitted at the boundary that owns the fact, after the
  state-changing command or the successful asynchronous result — not in a
  render path, a presentation helper, or a Core command compiler.
- Intent, success, and failure are separate deliberate decisions, not three
  accidental variants of one event.
- Bulk actions emit one event with a mode or size property, not one per item.

An event change is a schema change: renaming a property or changing its meaning
breaks existing reports and needs a deliberate deprecation.

## Verification

Assert analytics in the app orchestration test that owns the side effect, never
in a Core command or compiler test. For a migrated use case, verify that
no-ops and cancelled confirmations emit nothing, that a successful action emits
exactly once, that a bulk action emits one bucketed event, and that an
analytics failure does not change the product result.

Before a rollout, inspect the development payload, then confirm names,
parameters, page views, and the absence of private data in GA4 DebugView.

## Deployment-side work

Registering custom dimensions, building reports, and consent policy are
administration tasks in the GA property rather than source changes. The open
ones are tracked in [open-decisions.md](./open-decisions.md).

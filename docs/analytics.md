# Product analytics and diagnostics

In production, the app initializes GA4 on a page view when `REACT_APP_GAID` is set. The router reports navigation explicitly. Signing in sets the Zenmoney user ID as GA4 `user_id`, and logout clears it. Development logs product events to the console. The typed [event catalog](../src/6-shared/analytics/events.ts) defines the properties each event accepts.

## Page views

Explicit page views omit query strings and fragments. Internal referrers retain a cleaned path and external referrers retain only the origin. On a regular landing the initial tag configuration permits campaign attribution. For a missing route, the app and standalone 404 page mask malformed segments and common identifier patterns. Ordinary broken slugs remain visible.

To count missing-page views in GA4, filter **Page title** to `404 · Zerro` and group **Views** by **Page path** and **Page referrer**. Automatic history-based page views in the GA4 property can duplicate the router's events. Property settings are managed separately from this code.

## Adding an event

Use a stable `snake_case` name and bounded properties. Keep user-authored text, entity titles, identifiers and financial amounts out of new product-event properties. The configured GA4 user ID is separate from event properties. Record the outcome where the action completes. A bulk action emits once. Test successful actions, no-ops and cancellation at the orchestration boundary. Renaming a property changes existing reports. [Sender and page configuration](../src/6-shared/analytics/analytics.ts)

Sentry receives errors and diagnostics when configured for production. Its SDK collection settings are defined in [diagnostics.ts](../src/6-shared/diagnostics.ts). The repository has a Yandex Metrica configuration key but no counter loader.

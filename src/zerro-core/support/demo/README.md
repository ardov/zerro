# Demo fixtures

`getDemoData`, `makeDemoDiff` and `makeDemoStore` produce synthetic data for demo login and tests. Pin the locale, time and size when a test needs repeatable results. The English/European and Russian/RUB fixtures share recurrence and category structure. Account names, merchants, prices and comments are localized. [Locales](locales/)

Demo login picks the fixture for the current interface language and starts with its default display currency. A language change keeps the existing data until the next login. Demo currency preferences survive reload and are isolated from the signed-in account's preferences.

The landing page embeds the application with `?demo=embedded`. This document uses an in-memory router, preferences and replica adapter; it does not read or write the signed-in account's browser storage, register updates, start background sync or send analytics. Explicit sync uses the existing simulated demo transport. Undo/redo works within the session; persisted history is empty and reloading starts a fresh demo. Authentication opens the main application in a separate tab.

The embedded demo starts on Transactions with the first visible transaction selected. The selection initializes once, so closing it or navigating does not reopen it.

The landing presents the live interface as a thin rounded plate in perspective, with subtle depth blur. Language and theme updates are sent by the parent without reloading the demo, preserving edits and open dialogs.

The perspective interface has a small resting pitch and gently tilts toward a hovering mouse, then away from a primary pointer press. It settles back toward the cursor on release or to rest when the pointer leaves. Passive listeners in the same-origin iframe use its local coordinates, keeping normal editing and scrolling intact. Hover is limited to fine pointers; reduced-motion users see the static interface.

The interface fades in after the embedded application reports that its data and first render are ready. A readiness handshake also reapplies the current parent language and theme if they changed while the iframe was loading.

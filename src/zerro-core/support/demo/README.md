# Demo fixtures

`getDemoData`, `makeDemoDiff` and `makeDemoStore` produce synthetic data for demo login and tests. Pin the locale, time and size when a test needs repeatable results. The English/European and Russian/RUB fixtures share recurrence and category structure. Account names, merchants, prices and comments are localized. [Locales](locales/)

Demo login picks the fixture for the current interface language and starts with its default display currency. A language change keeps the existing data until the next login. Demo currency preferences survive reload and are isolated from the signed-in account's preferences.

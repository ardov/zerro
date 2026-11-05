# Zerro Core Demo Data

This optional Zerro Core module owns deterministic public demo data. It describes what a realistic normalized Zenmoney/Zerro snapshot can look like without using private account data.

`getDemoData`, `makeDemoDiff` and `makeDemoStore` accept `locale: 'en' | 'ru'`.
The default is the English/European fixture. Demo login selects the fixture from
the current interface language and uses its default display currency.
The Russian fixture uses RUB, Russian banks, merchants, category/account names
and transaction comments. Its illustrative household prices and recurring
transfers are defined in `locales/ru.ts`; they are fixed samples, not live quotes
or historical prices. Dates, recurrence rules and category appearance are shared
by both fixtures. Changing the interface language inside an existing session
does not replace its data; the selected fixture is loaded on the next demo login.
Demo display-currency preferences are stored separately from signed-in account
preferences and survive reloads. Each new demo login starts in the fixture's
default currency; leaving the demo restores the ordinary account preference.

## Creating demo data is needed for:

- Testing. That's why it should be predictable and repeatable.
- Stress testing. That's why the amount of transactions/tags/merchants/accounts should be adjustable.
- User demo. That's why it should be realistic and not too big.

## Some requirements

- Generator is given a point in time and transactions are generated from that point with a regular pattern. Then every generation with the same parameters should produce the same data.
- There should an option to provide end date to limit the amount of transactions.
- Transaction frequency should be adjustable to generate more or less transactions.
- Each class of transactions should follow it's own pattern.
- There should be no random.
- Countries, companies, and instruments are fixed.
- For testing purposes, ids of accounts, tags, merchants, etc. should include the name of the object. For example, account with name "Cash" should have id "Cash".
- Transaction ids should be unique.
- Generator system should be flexible so I could adjust code for different needs.

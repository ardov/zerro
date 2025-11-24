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

# Transactions

Each transaction has income and outcome legs with their own accounts, instruments and amounts. Canonical soft-deleted rows can have a null account leg. The raw sorted list includes deleted rows. Visible history excludes rows flagged deleted or with both amounts below `0.0001`. [Read rules](read.ts)

Posting creation handles income, expense and debt, with optional merchant, payee and original-currency amounts. Transfer creation takes the two accounts and their amounts. A new merchant and posting can form one undoable command. [Compilers](commands.ts)

`created` and `originalPayee` are creation-only. Editing the calendar date can update the existing row. Changing the time in the editor recreates it under a fresh ID and purges the original through an amount write. Repeated edits before sync can create intermediate rows. Transport omits a locally purged intermediate absent from the canonical base. Restoring a deleted transaction also creates a fresh ID. [Materialization](../../../../../support/documents/materialization.md) · [Deletion semantics](../../sync-api.md#deletion-semantics)

# Full backup restore improvement plan

- Status: checkpoints 1–11 and debt-singleton restore guard shipped;
  complete-preview UI remains
- Updated: 2026-08-02
- Scope: full-backup validation, semantic reconciliation, id remapping,
  writable entity coverage, deletion cascades, preview, and verification

## Outcome

A valid full backup either fails before preview with a precise compatibility
reason, or one ordinary restore command moves the current replica to a
semantically equivalent state. The command stays in the durable outbox, remains
undoable before manual sync, and is recomputed against the latest `current` at
confirmation time. Applying the same backup again produces no command, even
when restored entities had to receive fresh ids.

The end-to-end path is:

```text
JSON
  -> strict full-backup validation
  -> normalized desired store
  -> current-account compatibility check
  -> reconciliation and desiredId -> actualId mapping
  -> restore plan and preview
  -> TIntentPatch with real UUIDs
  -> ordinary outbox command
  -> local-only predicted cascades
  -> manual sync
```

## Settled product decisions

- Import accepts only a complete backup produced by Zerro. Incremental or
  partial ZenMoney diffs are not importable backups.
- No format envelope or explicit version field is added yet. The complete
  exported shape is the format contract; incompatible shape changes require an
  explicit validator update.
- Export continues to read `state.data.base`. Pending local commands are not
  part of a backup.
- When the outbox is non-empty, export warns that unsynchronized local changes
  will not be included and lets the user cancel or download anyway. Export
  never triggers sync.
- Restore remains one ordinary command. It enters the outbox, can be undone
  before sync, is never pushed automatically, and is recalculated at confirm
  time instead of reusing the preview patch.
- Restore is always a complete point-in-time snapshot. There is no user-facing
  scoped restore or partial merge mode; the backup's full state is the desired
  state to reconcile.
- A desired entity whose old id is no longer a live same-id entity is never
  created under that old id. ZenMoney hard deletion leaves a permanent
  tombstone, and the local store does not retain enough tombstone history to
  prove an absent id is reusable.
- Same-account restore is supported. Cross-account import is a separate
  migration feature and must not be inferred from a structurally valid file.
- Read-only dictionaries (`instrument`, `country`, and `company`) are validated
  but never written by restore.
- User billing and subscription fields are never restored.

## 1. Define and validate a complete backup

Primary files:

- `src/4-features/import/importBackup.ts`
- a new focused validator such as
  `src/4-features/import/validateFullBackup.ts`
- `src/4-features/import/importBackup.test.ts`

### 1.1 Top-level contract

A backup must contain `serverTimestamp` and all eleven entity arrays, including
empty arrays:

```text
instrument
country
company
user
merchant
account
tag
budget
reminder
reminderMarker
transaction
```

Validation rules:

- the parsed value is a plain object;
- `serverTimestamp` is a finite non-negative number;
- every collection above is present and is an array;
- `deletion` is absent because the full exporter does not write it;
- unknown top-level collections are rejected: a client cannot honestly claim
  a complete restore while ignoring an unknown data domain.

This rejects `{"transaction":[]}`, `{"account":[]}`, and ordinary incremental
ZenMoney diffs before they can be interpreted as empty snapshots for all
missing domains.

### 1.2 Runtime row validation

Do not cast arbitrary JSON to `TZmDiff` and rely on the converter. Add explicit
runtime guards derived from the Core-owned wire types. For every row:

- require a plain object;
- require the correct id type where the wire entity has an id;
- validate every known scalar, nullable field, enum, and array element;
- require finite numbers for timestamps, amounts, and numeric identifiers;
- validate ISO date fields rather than accepting arbitrary strings;
- require the fields the wire format promises;
- reject duplicate ids inside one collection;
- reject duplicate budget identity by `(date, tag)`, because a wire budget has
  no explicit id;
- allow `transaction.source` to contain any valid JSON value within its
  documented `unknown` boundary.

Validation runs before `convertDiff.toClient`. A file accepted by parsing must
not be able to throw later during preview or command issue.

### 1.3 Referential integrity

After wire validation and normalization, validate the graph:

- exactly one user has `parent: null`;
- every entity owner refers to an existing user;
- accounts refer to existing instruments and nullable existing companies;
- tag parents exist and the tag graph is acyclic;
- budgets refer to existing tags where non-null;
- reminders refer to existing accounts and nullable existing tags/merchants;
- reminder markers refer to existing reminders, accounts, and nullable
  tags/merchants;
- transactions refer to existing accounts and nullable existing
  tags/merchants/reminder markers;
- the root user's currency refers to an existing instrument.

Keep structural parsing separate from current-account compatibility: a backup
can be internally valid yet belong to another account.

### 1.4 Error categories

Use stable categories at the import boundary:

- `unreadable`: file read or JSON parsing failed;
- `notABackup`: the complete shape, row schema, uniqueness, or internal graph is
  invalid;
- `incompatibleBackup`: the file is a valid complete backup but cannot be
  restored into the current account.

Detailed validator diagnostics may be retained for tests and logs, while the
UI uses concise localized messages.

### 1.5 Completion gate

- Every file currently produced by `exportJSON(base)` passes.
- Removing any required top-level key fails.
- A partial diff fails.
- Malformed rows and dangling references fail before preview.
- `parse -> convert -> toStore` cannot throw for an accepted file.
- A realistic `parse(export(base))` round trip is covered.

## 2. Warn when export excludes pending changes

`getDataToSave` continues to use `state.data.base`; do not change it to
`current`.

Behavior:

- with an empty outbox, download immediately;
- with a non-empty outbox, show a confirmation explaining that the backup
  contains the last synchronized state and excludes current unsynchronized
  changes;
- offer cancel and download-anyway actions;
- never sync as part of export.

Do not call `outbox.length` a number of data changes: one command may contain
many entity writes. Tests must prove that confirmation still exports `base` and
never serializes `current` or the outbox.

## 3. Expand the writable restore model

### 3.1 Root user setting

Add a `TUserPatch`, add `user` to `TIntentPatch`, and teach issue/materialization
to handle an existing-only entity. Restore `currency` and `monthStartDay` on
the root user.

Do not restore:

- `paidTill`;
- `subscription` or `subscriptionRenewalDate`;
- login or email;
- `isForecastEnabled`;
- `planBalanceMode` or `planSettings`.

The latter fields require separate server-mutability evidence and product
decisions before they can enter the writable set. A user is never created or
deleted by restore. Preview labels this as user settings, not user creation.

Materialization must merge the sparse setting into the existing full root user,
advance `changed` normally, and send the resulting full user entity through the
normal primary-only transport.

### 3.2 Reminder markers

Extend `entities/reminderMarkers.ts` with required fields, writable fields, a
patch type, and an intent type. Register `makeReminderMarker` in the
materializer, add `reminderMarker` to `TIntentPatch` and `intentEntityKeys`, and
support marker creation, update, deletion, summary, and UI labels.

Add observed `isForecast` as an optional read-only field. Do not send it until
write behavior is verified.

Normalize `state: 'deleted'` as absence:

- never create a desired marker in that state;
- delete a current active marker when desired contains its deleted form;
- never send `state: 'deleted'` as an ordinary update, because ZenMoney drops
  that field-level write.

## 4. Replace id-only diffing with one restore planner — shipped 2026-08-01

`buildRestorePlan` is the internal planner behind both preview and apply:

```ts
buildRestorePlan(current, desired, {
  scope,
  allocateId,
}): TRestorePlan
```

The transient plan contains:

- per-entity `desiredId -> actualId` mappings;
- creations, updates, and removals;
- future unsupported actions;
- the base summary; effective cascade effects follow the cascade checkpoints;
- the resulting `TIntentPatch` when real ids are available.

It matches a live same-id row first, then exact semantic rows as a deterministic
multiset, and allocates a fresh id only for an unmatched creatable row. Keep the
planner internal; the public `core.restore.preview` and `core.restore.apply`
surface remains unchanged.

### 4.1 Preview and apply allocation

Preview uses deterministic placeholder ids such as
`__restore__:transaction:<desired-id>`. Apply calls the command compiler with
`ctx.uuid()` and uses real ids. Preview must not consume UUIDs.

Both paths use the same planner. Their only expected differences are generated
ids and concurrent state that landed after preview. Confirm-time apply still
recomputes against the latest `current`.

### 4.2 Matching algorithm

For each writable entity type:

1. Normalize current and desired rows.
2. Match eligible live rows with the same id.
3. Among the remaining rows, perform exact semantic matching.
4. Treat semantic matches as a multiset: fingerprint maps to a deterministic
   sorted queue of ids, and each current row is consumed at most once.
5. Allocate a fresh id for every unmatched desired row whose type has generated
   ids.
6. Record `desiredId -> actualId`.
7. Rewrite desired references through already-built mappings.
8. Produce creates and updates.
9. Remove unmatched current rows according to the entity's removal strategy.

The implementation must be approximately `O(n log n)` and must not compare
every transaction with every other transaction.

### 4.3 Entity registry contract

Do not fingerprint every runtime field except `id` and `changed`: some fields
are server-owned and cannot survive recreation. Extend the registry to define:

- update fields;
- creation fields;
- semantic fingerprint fields;
- immutable fields whose difference requires replacement;
- ignored server-owned fields;
- removal strategy.

For transactions, build the semantic fingerprint from
`transactionIntentFields`: immutable `created` plus every field Core can carry
through recreation. Exclude `id`, `changed`, owner identity, and server-only
fields such as `source` when Core cannot preserve them. Normalize lifecycle
separately so active candidates compare as active.

`created` remains significant. If a live same-id transaction has a different
desired `created`, it cannot be updated in place: create a fresh replacement and
soft-delete the old row.

### 4.4 Canonical equality

Diffing, semantic fingerprints, issue-time no-op removal, and acknowledgement
must share entity-aware canonical equality. Replace the field-only helper with
an API equivalent to:

```ts
isSameEntityFieldValue(entityKey, field, left, right)
```

Cover at least:

- empty and null comments;
- empty and null payees where server evidence applies;
- absent and canonical-null optional transaction fields;
- transaction tags as a set rather than ordered presentation;
- confirmed reminder scheduling canonicalizations such as empty points;
- deep JSON equality for supported object-valued fields.

Do not add a canonicalization without server evidence or an existing factory
contract.

### 4.5 Mapping order

Build mappings in dependency order:

1. root user compatibility;
2. read-only dictionary compatibility;
3. accounts;
4. merchants;
5. tags, parent before child;
6. reminders;
7. reminder markers;
8. transactions;
9. budgets after tag mapping.

For tags, a desired child becomes eligible only after its desired parent is
mapped. Fingerprint the child using the mapped actual parent id. Reject cycles
in backup validation. Recompute each budget's actual normalized id from mapped
tag plus date.

### 4.6 Transaction lifecycle

Treat a desired soft-deleted transaction as absent from the active target.
Treat a current soft-deleted transaction as inert: it participates in neither
same-id nor semantic matching and needs no repeated deletion.

Required cases:

- live `A` on both sides updates in place;
- current deleted `A`, desired live `A`, and live semantic replacement `B`
  maps `A -> B` with no write;
- current deleted `A`, desired live `A`, no replacement creates fresh `C`;
- absent current `A`, desired live `A` creates fresh `C`, never `A`;
- unmatched current live transactions soft-delete;
- duplicate exact operations reconcile by cardinality, not set membership.

### 4.7 Idempotence

Make this a central property test:

```text
restore(current, desired) -> restored
restore(restored, desired) -> no command
```

It must hold when accounts, tags, reminders, markers, and transactions received
fresh ids and when exact duplicate rows exist.

## 5. Audit creation factories

Before relying on fresh-id recreation, audit:

- `makeAccount`;
- `makeTag`;
- `makeReminder`;
- `makeReminderMarker`;
- `makeTagBudget`;
- `makeTransaction`.

Several factories use `||` where legal `false`, `0`, empty arrays, or nullable
values may be meaningful. Use `??` where the domain distinguishes those values.
Do not make a blind mechanical replacement: choose defaults from the wire and
factory contracts.

For each creatable type, add a one-command convergence test:

```text
desired-only entity
  -> issuePatch/materializeCommand creation
  -> semantic restore diff is empty
```

This prevents a first restore from creating an approximate entity and a second
restore from emitting a cleanup update.

## 6. Removal strategies

| Entity                 | Restore removal                                |
| ---------------------- | ---------------------------------------------- |
| user                   | unsupported; never remove                      |
| account                | server deletion, except protected debt account |
| merchant               | server deletion; blocked by active debt link   |
| tag                    | server deletion after cascade evidence         |
| budget                 | zero `income` and `outcome`                    |
| reminder               | server deletion                                |
| reminder marker        | server deletion                                |
| transaction            | soft-delete                                    |
| read-only dictionaries | ignored; never remove                          |

### 6.1 Debt account

Debt is a protected singleton and a required account invariant:

- a complete backup must contain exactly one account with `type: Debt`; zero or
  multiple debt rows make the file `notABackup`;
- the current replica must also contain exactly one debt account at restore
  time; zero or multiple rows are an invalid current state and restore must
  stop before preview or command issue;
- map the backup debt id to the current debt id before general account
  matching, then apply that mapping to every restored reference;
- never create, update, or delete the debt account, and never include it in the
  user-facing restore summary. Its id, title, balance, instrument, and other
  account fields are container details and are ignored.

The server does not expose a supported operation for creating or deleting the
debt singleton. If the current replica violates the invariant, the eventual
repair flow should offer the existing full **Reload data** action, which drops
unsaved local changes and history before pulling the canonical server state.

## 7. Predict deletion cascades locally

Keep primary user intent and predicted server effects separate. Transport sends
only primary upserts and deletion entries. `materializeCommand` adds local-only
effects so `current` immediately matches the expected canonical state.

Target order:

```text
materialize primary intent
  -> predict verified hard-purge writes
  -> predict deletion cascades
  -> predict account balances
```

### 7.1 Account deletion

Before implementation, preserve real canonical response fixtures for:

- a non-transfer transaction contained only in the deleted account;
- a transfer between deleted and surviving accounts;
- a transaction created and affected by account deletion in one batch;
- an already soft-deleted transaction;
- protected debt account deletion.

Round 6 supplies the ordinary-operation and both transfer-direction fixtures:
the contained row is hard-purged; a transfer becomes one-sided by copying the
surviving account id into both legs and zeroing the deleted side; the surviving
balance stays unchanged. Its tagged fixture first forceFetch-confirmed the tag,
but the transfer was already canonicalized to `tag: null` before deletion:
category stripping belongs to transfer materialization, not this cascade.

Prediction must:

- hard-purge transactions with no surviving account and emit local tombstones;
- reproduce the exact one-sided transaction shape when one account survives;
- recalculate surviving account balances;
- never leak predicted transaction or balance patches into transport.

### 7.2 Tag deletion

Round 6.1 supplies the single-tag ordinary-income and ordinary-outcome fixture:
deleting the tag preserves both rows, replaces their `tag` with `null`, and
does not alter the account balance. Round 6.2 confirms that the matching budget
row is removed, rather than zeroed. Checkpoint 10 applies the settled category
rule to every local tag reference: remove the deleted id, normalize an empty
array to `null`, clear child-tag parents, and remove affected budget rows
without sending those cascade writes as client intent.

### 7.3 Merchant deletion

Round 6.3 settled the clean merchant behavior: deleting it preserves ordinary
transactions, reminders, and markers but nulls their `merchant` and `payee`;
transaction `originalPayee` remains. A cash transfer never stores merchant or
payee. An active debt transaction is the exception: the server silently keeps
the merchant, so restore leaves it in place and local materialization withholds
the otherwise predicted deletion.

### 7.4 Effective summary

Preview counts effective changes, including cascades, rather than classifying
only primary patch rows. A large account deletion must disclose the operations
it purges or rewrites. Explicit and cascade handling of the same row is counted
once.

## 8. Current-account compatibility

After parsing but before preview:

- require the backup root user to match the current root user;
- require every read-only dictionary id needed by restored entities to exist in
  the current dictionaries;
- reject incompatible currency, instrument, or company references;
- never silently re-own another account's complete backup.

A valid but foreign or dictionary-incompatible file returns
`incompatibleBackup`. Cross-account migration remains out of scope.

## 9. Preview and confirmation UI

Build preview from `TRestorePlan`, not by retrospectively classifying an opaque
patch. Display:

- user settings;
- accounts;
- categories;
- merchants;
- budgets;
- reminders;
- reminder markers;
- transactions;
- unsupported actions;
- effective cascade changes.

Replace the current limitations copy when recreation and deletion ship. Explain
that newer data is overwritten, deleted operations may return under fresh ids,
accounts/categories/merchants may be removed after sync, the command can be
undone before manual sync, and the old server identity is not restored.

Apply still recomputes after preview. A background pull may change counts. Show
the completion snackbar only if a command was actually appended.

## 10. Verification matrix

### Complete backup validation

- current full export accepted;
- each required key missing in turn;
- partial ZenMoney diff rejected;
- duplicate ids and budget identity;
- malformed dates, numbers, enums, and arrays;
- zero or multiple root users;
- every dangling reference class;
- tag cycles;
- unknown top-level collection;
- unexpected `deletion` array.

### User and marker coverage

- root-user `currency` and `monthStartDay` restored;
- billing and unsupported user fields ignored;
- users never created or deleted;
- marker create, update, and delete;
- marker references remapped;
- marker `state: 'deleted'` becomes deletion;
- a marker-only difference no longer reports a matching file.

### Reconciliation

- same-id update;
- cross-id restored transaction match;
- hard-deleted id never reused;
- soft-deleted old id does not block recreation;
- duplicate cardinalities: 1:1, 1:2, and 2:1;
- deterministic matching;
- immutable `created` difference causes replacement;
- tag ordering and known null/empty canonicalizations.

### Reference remapping

- accounts in transactions/reminders/markers;
- merchants;
- transaction and reminder tag arrays;
- tag parents;
- reminder id in marker;
- marker id in transaction;
- budget id after tag remapping;
- Zerro hidden-settings reminder and its data account.

### Deletions and cascades

- ordinary account purge;
- transfer survivor conversion;
- debt deletion unsupported;
- tag transaction and budget cleanup;
- merchant cleanup, including the debt-reference blocker;
- balances after every cascade;
- predicted effects absent from transport.

### Replica integration

- restore appends exactly one outbox command;
- undo returns to the pre-restore state;
- redo reapplies restore;
- pending restore survives persisted replica reload;
- background pull rebases it;
- manual sync sends primary intent only;
- canonical response acknowledges it;
- repeating the same restore is a no-op.

### UI and project gates

- export warning with non-empty outbox;
- complete preview labels and unsupported rows;
- confirm, cancel, unreadable, invalid, and incompatible flows;
- full Vitest suite;
- TypeScript and ESLint;
- API-boundary and Core package checks;
- a realistic large-store performance check proving no `O(n^2)` transaction
  reconciliation.

## 11. Recommended commit sequence

1. `test(import): define strict full-backup contract`
2. `feat(import): validate complete backup and references`
3. `feat(export): warn when pending changes are excluded`
4. `feat(core): support root-user preference restore`
5. `feat(core): add reminder marker intents and restore`
6. ~~`refactor(core): introduce restore reconciliation plan`~~ Shipped 2026-08-01.
7. ~~`feat(core): restore entities with fresh ids and remap references`~~ Shipped 2026-08-01.
8. ~~`fix(core): make entity factories restore-idempotent`~~ Shipped 2026-08-02.
9. ~~`feat(core): predict account deletion cascades`~~ Shipped 2026-08-02.
10. ~~`feat(core): predict tag deletion cascades`~~ Shipped 2026-08-02.
11. ~~`feat(core): support merchant deletion after API verification`~~ Shipped 2026-08-02.
12. `feat(import): show complete restore preview and limitations`
13. `docs(core): update restore and materialization contracts`

Each commit must pass independently. Account, tag, and merchant cascades stay in
separate checkpoints because they have distinct server evidence and failure
modes.

## 12. Documentation updates during implementation

- `design-ledger.md`: replace the current "never resurrects" decision with
  fresh-id recreation, record the complete-backup contract, and record export
  from `base` plus the pending-change warning.
- `materialization.md`: mark each shipped cascade implemented and link its
  canonical response fixture.
- `sync-api.md`: preserve new account/tag/merchant probe results.
- `notes.md`: advance the checkpoint list as commits land.

### 12.1 Deferred local-state validation

Restore-time validation of the current debt singleton is part of the restore
checkpoint. Validation while loading persisted local state is deliberately
deferred: add it later at the persistence/load boundary and show the existing
full **Reload data** modal when the invariant is broken. Do not broaden the
current restore implementation to repair local state during startup.

Do not rewrite those contracts ahead of implementation except where a settled
decision already differs from the current wording. The plan is the future work;
the ledger describes shipped behavior and accepted current limitations.

## 13. Out of scope

- partial diff import or merge import;
- cross-account migration;
- restoring an outbox from backup;
- exporting `current`;
- automatic sync after restore;
- billing/subscription restoration;
- writes to server dictionaries;
- reuse of old tombstoned ids;
- the journal and history UI;
- splitting one restore into several network commands.

## Final completion criterion

A complete backup is either rejected before preview with a stable reason, or a
single restore command produces a semantically equivalent store with every
restorable reference mapped to a live actual id. Undo works before manual sync,
transport contains no predicted effects, canonical sync confirms the result,
and importing the same file again appends no command.

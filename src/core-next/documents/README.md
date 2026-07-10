# Core Next documentation

`src/core-next` is the staged extraction of Zerro domain behavior into a
storage-agnostic module. These documents are the durable control plane for the
migration; implementation history belongs in Git.

## Start here

For a new task or agent:

1. Inspect `git status --short` and the current `src/core-next` tree.
2. Read [handoff.md](./handoff.md) for the verified branch state and default
   next slice.
3. Read the relevant section of [architecture.md](./architecture.md) before
   changing a boundary or contract.
4. Use [roadmap.md](./roadmap.md) to choose another independent track.
5. Check [design-ledger.md](./design-ledger.md) before settling an open question
   or removing a compatibility bridge.

The handoff is routing, not proof that code landed. Always verify the tree.

## Current position

- Production Core is independent of Redux, React, i18n, storage, ZenMoney HTTP,
  and runtime imports from `6-shared`.
- Core owns normalized ZenMoney entities, patch/replay primitives, Zerro hidden
  data, read projectors, and a substantial command layer.
- Most budget, envelope, goal, activity, transaction, debtor, and balance reads
  now reach the app through `core-next/adapters/redux`.
- Budget, goal, and envelope writes use the Core command funnel; remaining
  writes pass through the legacy patch bridge.
- Every local Redux patch now passes through an identity materializer. Server
  diffs bypass it as already canonical.
- `createZerroEngine` models outbox replay but has no production owner yet;
  Redux must remain the sole reactive state owner in the app.
- The session is snapshot-based and lazily memoized. Namespaced `get*` reads are
  the semantic facade; flat `session.read.*` remains deprecated compatibility.
- Session envelope reads are domain-only. The Redux adapter adds localized
  groups, icons, and generated/display colors while preserving legacy output.
- Envelope rename now has a narrow semantic compiler and Redux command;
  NameCell no longer sends a partial envelope projection.
- Tag envelope color has a validated semantic command; the color picker no
  longer sends a partial envelope projection.
- Transaction commands compile transaction intent only; account-balance
  effects are reserved for the final materializer phase.
- Envelope comments have a semantic metadata command; CommentWidget no longer
  sends a partial envelope projection or an unused month prop.
- EnvelopeEditDialog uses one explicit atomic settings command and no longer
  carries a dead create mode or hidden projection fields.
- Envelope creation is one semantic tag+metadata command with an envelope-id
  receipt; the app feature no longer chains legacy tag and envelope models.
- Envelope hierarchy is one semantic structure command; drag-and-drop, group
  move, group assignment, and group rename send full structure input and the
  legacy `applyStructure` thunk is gone.
- The envelope write family is fully semantic: the compatibility
  `patchEnvelope` thunk and `zerro.envelope.patch` command are removed, and
  envelope drafts stay internal to Core compile functions.

## Default next slice

Add semantic transaction commands, starting with deletion and restore.

1. Define narrow id-based inputs instead of partial transaction payloads.
2. Compile intent-only patches; account effects wait for the materializer.
3. Route the chosen thunks through the command funnel.
4. Leave the remaining transaction thunks on the legacy bridge for now.

See [roadmap.md](./roadmap.md) for completion criteria and parallel tracks.

## Document map

| Document                                     | Question it answers                                |
| -------------------------------------------- | -------------------------------------------------- |
| [handoff.md](./handoff.md)                   | What is true on this branch right now?             |
| [architecture.md](./architecture.md)         | Which boundaries and contracts should remain true? |
| [roadmap.md](./roadmap.md)                   | What can be done next, and in what order?          |
| [design-ledger.md](./design-ledger.md)       | Which decisions are settled, open, or temporary?   |
| [testing.md](./testing.md)                   | Which tests protect which kind of change?          |
| [private-fixtures.md](./private-fixtures.md) | How can private parity data be used safely?        |

Entity-specific ZenMoney knowledge belongs beside the implementation under
`src/core-next/zenmoney/*/README.md`, not in the migration roadmap.

## Working rules

- Prefer one bounded layer and its tests over a broad rewrite.
- Keep the root `core-next` entrypoint facade-only.
- Treat `core-next/zenmoney` and `core-next/zerro` as internal migration paths,
  not supported app-facing APIs.
- Keep pure projectors explicit about dependencies.
- Keep presentation, localization, SVG URLs, Redux, and persistence outside
  domain code.
- Compare resulting state for command migrations, not only patch shape.
- Never print or commit private fixture contents.
- Update the handoff, roadmap, or design ledger in the same slice when their
  claims change.

## Verification defaults

For ordinary Core work:

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
```

For a narrow slice, run focused tests first, then the full suite when a shared
boundary such as patch application, materialization, Redux state, or package
exports changes.

Private fixture commands are opt-in and documented separately.

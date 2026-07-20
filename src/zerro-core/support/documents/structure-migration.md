# Zerro Core structure migration

- Updated: 2026-07-20
- Status: active
- Scope: `src/zerro-core` source layout, entrypoints, and import boundaries
- Rule: providers appear before consumers. A folder may import its own level or
  an alphabetically earlier level; it must not import a later level.

The runtime behavior and public Redux namespaces are already stable. This
migration makes their ownership and dependency direction visible in the source
tree without introducing a second engine, new domain abstractions, or a
published-package policy.

## Target layout

```txt
zerro-core/
  internal/
    domain/
      foundation/
      zenmoney/
        entities/
        model/
        read-models/
      zerro/

    operations/
      materialization/
      replication/

    projections/

  public/
    session/

  runtime/
    persistence/
    presentation/
    redux/

  support/
    demo/
    documents/
    testing/
```

Thin source entrypoints keep consumer imports short:

```txt
zerro-core                 -> public session facade
zerro-core/redux           -> runtime Redux facade (`redux.ts`)
zerro-core/replica         -> replica integration seam (`replica.ts`)
zerro-core/demo            -> demo support facade (`demo.ts`)
zerro-core/support/testing/* -> test support, imported explicitly by tests
```

These are source-module boundaries for the current application. They do not
create npm package subpaths or make implementation modules supported APIs.

## Alphabetical dependency rule

At each level the directory names describe the permitted dependency direction:

```txt
internal -> public -> runtime -> support
domain -> operations -> projections
foundation -> zenmoney -> zerro
entities -> model -> read-models
materialization -> replication
persistence -> presentation -> redux
```

A later layer may import an earlier layer. An earlier layer must not import a
later layer. In other words, dependency arrows follow the displayed order while
source import arrows point back toward the provider. Adjacent folders do not
need to depend on each other; for example, operations and projections may both
depend directly on domain.

## Ownership rules

### Domain foundation

`foundation` owns dependency-free dates, timestamps, collection helpers,
generic entity-patch types, keys, and numeric helpers. It imports nothing from
ZenMoney or Zerro. Currency-specific amounts remain in ZenMoney rather than
creating a reverse `foundation -> zenmoney` edge.

### ZenMoney

- `entities` owns normalized entity types, local facts, factories, and entity
  command compilers. Entity behavior accepts narrow structural sources and
  returns narrow entity patches; it must not import the later aggregate model.
  Small entities remain flat files; folders are reserved for entities with
  several cohesive concerns.
- `model` owns the normalized store, intent/applied patch contracts, dumb patch
  application, and replay.
- `read-models` owns cross-entity derived values such as debtors and balance
  history. These are not normalized entities.

ZenMoney does not own Zerro conventions such as the pinned-account suffix,
generated display colors, localized names, or presentation-ready rows.

### Zerro

`zerro` owns product behavior layered on normalized ZenMoney data: hidden-data
formats, account conventions, envelopes, budgets, goals, activity, and
high-level command compilation.

### Operations and projections

- `materialization` expands sparse commands into complete local effects.
- `replication` owns pure `base + outbox + outboxHead` operations and depends on
  materialization rather than reimplementing it.
- `projections` owns the shared read dependency graph and memoization wiring;
  pure domain projectors remain beside their domain owner.

### Public, runtime, and support

- `public` owns the package-safe snapshot session facade.
- `runtime` owns current-app adapters: persistence, presentation policy, and
  Redux.
- `support` owns demo data, documentation, and test builders. Production layers
  never import support.

## Migration waves

### W1. Entrypoints and enforceable boundaries — complete

- add the explicit `zerro-core/replica` integration entrypoint;
- move app and worker consumers off `infrastructure/replica/*`;
- replace the implementation-subpath regex with an explicit production
  entrypoint allowlist that also catches relative imports into Core;
- keep `6-shared/types` as the documented compatibility exception.

Exit: API-boundary tests, replica tests, TypeScript, and the package consumer
pass with no behavior change.

### W2. Independent foundation — complete

- replace `domain/shared` with `domain/foundation`;
- move date/time ownership into foundation so it has no ZenMoney imports;
- keep FX amount helpers in ZenMoney and generic rounding in foundation;
- add a dependency check that foundation imports no later layer.

Exit: the directory-level `shared <-> zenmoney` cycle is gone.

### W3. ZenMoney entities, model, and read models — complete

- move normalized entity modules under `zenmoney/entities`;
- move store, patch application, and replay under `zenmoney/model`;
- move balances and debtors under `zenmoney/read-models`;
- replace entity imports of the aggregate store/intent model with narrow source
  and result contracts so `entities -> model` never becomes a cycle;
- keep entity behavior colocated and avoid a folder for each tiny entity;
- move Zerro account conventions and presentation-ready account projections out
  of ZenMoney;
- split the persisted RGB codec from generated presentation colors.

Exit: every ZenMoney file has one of three visible roles and broad internal
ZenMoney barrels are no longer needed.

### W4. Operations and shared projections — complete

- move the materializer to `internal/operations/materialization`;
- move pure outbox operations to `internal/operations/replication`;
- move the projection graph and memo helpers to `internal/projections`;
- retain one implementation of materialization, replay, append, undo/redo,
  head clamping, and transport.

Exit: application processes are separated from both domain definitions and
runtime ownership.

### W5. Public and runtime implementations — complete

- move the snapshot facade under `public/session`;
- move the completed `domain`, `operations`, and `projections` implementation
  trees under `internal` in one mechanical path wave;
- move persistence, package-safe presentation policy, and Redux implementation
  under `runtime`;
- preserve the root, Redux, and replica entrypoint imports through thin named
  facades;
- rename the Redux `infrastructure` namespace to the capability it actually
  exposes (`debug`) or remove it if its consumer is gone.

Exit: consumers import entrypoints only; implementation paths live under
`internal`, `public`, `runtime`, or `support` according to ownership.

### W6. Support and cleanup — complete

- move demo, documents, and test builders under `support` while retaining only
  the useful compatibility entrypoints;
- replace broad internal `export *` barrels with direct owner imports;
- remove temporary forwarding files after the last consumer moves;
- update architecture and the design ledger to the final paths.

Exit: the complete tree reads in dependency order and the boundary test rejects
every backward or undeclared external import.

## Verification

Each wave runs focused tests for the moved contract plus TypeScript. Run the
full suite for materialization/replication waves, and run
`zerro-core:package-check` whenever a package-facing declaration changes. Do
not combine behavior changes with mechanical path moves.

Completion requires:

1. no production import of a Core implementation path;
2. no backward dependency in the alphabetical hierarchy;
3. unchanged public Redux namespace behavior except an explicitly approved
   namespace rename;
4. one authoritative replica/materialization implementation;
5. the verification gate in [testing.md](./testing.md) remains green.

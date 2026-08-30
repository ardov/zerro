# Verification

The repository exposes one verification interface for maintainers, agents, and
CI. Commands are deterministic and fail on the first unsuccessful gate.

## Command tiers

| Command           | Contract                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| `pnpm test`       | Run the complete unit suite once with compact output.                   |
| `pnpm test:watch` | Run the unit suite interactively.                                       |
| `pnpm verify`     | Check whitespace, formatting, JS, CSS, TypeScript, and the unit suite.  |
| `pnpm verify:ui`  | Build the app and Storybook, then test eligible stories in both themes. |
| `pnpm verify:all` | Run both verification tiers and the Knip dependency check.              |

`verify:ui` is an additional tier: run it after `verify`, or use `verify:all`
when both are required. It deliberately keeps the light and dark Storybook
projects; a passing story in one theme does not substitute for the other.

## Implementation loop

Run the narrow test that observes the changed contract while implementing:

```sh
pnpm exec vitest run path/to/test.ts --reporter=agent --silent=passed-only
pnpm test:related path/to/source.ts
pnpm test:changed
```

`test:related` and `test:changed` use Vitest's dependency graph. They save time,
but neither command claims to select every policy-required regression or manual
smoke. Do not repeat a successful broad gate while its inputs are unchanged.

## Handoff routing

| Changed surface                          | Final verification                                     |
| ---------------------------------------- | ------------------------------------------------------ |
| Documentation only                       | Touched-file Prettier plus `pnpm verify:whitespace`    |
| Application, Core, store, or local tool  | Focused contract tests, then `pnpm verify`             |
| UI, styles, stories, or UI configuration | Focused tests, then `pnpm verify` and `pnpm verify:ui` |
| Cross-cutting or dependency change       | Focused tests, then `pnpm verify:all`                  |
| Replica persistence or sync              | `pnpm verify` plus the policy-required manual smoke    |

Area-specific policies can require more evidence, never less:

- `src/zerro-core/support/documents/testing.md` — Core contracts and broad-test
  triggers;
- `src/zerro-core/support/documents/local-tooling.md` — local finance-tool
  contracts;
- `docs/ui-styling.md` — UI and Storybook behavior.

## CI

Pull requests and direct pushes to `master` and `core-next` run the baseline
verification job. A dependent UI job runs only when application/UI sources,
stories, public assets, relevant build/test configuration, dependencies, or its
workflow change. Core remains UI-relevant because fixture-backed App Scenarios
consume Core behavior.

Local port-binding and browser-transport failures are environment failures until
the same command is rerun in an environment that permits a local browser server.
Do not report either a product regression or a passing UI suite from an
interrupted run.

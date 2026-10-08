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

Browser tests use at most two workers. For ordinary local work, run only the
story files relevant to the task, in both light and dark themes. Include direct
consumers when changing a shared component. A passing story in one theme does
not substitute for the other.

Run the full browser suite (`pnpm test:storybook` without file filters,
`pnpm verify:ui`, or `pnpm verify:all`) only when the user explicitly requests it
or changes are genuinely global: for example, app-wide theme/token changes,
shared overlay infrastructure, or a framework upgrade affecting the whole UI.
A local component cleanup, a single shared control, or any dependency change
by itself is not a reason for a full run. State the global impact before
starting one. Keep full runs available locally; this policy does not move them
to CI or change CI configuration.

## Implementation loop

Run the narrow test that observes the changed contract while implementing:

```sh
pnpm exec vitest run path/to/test.ts --reporter=agent --silent=passed-only
pnpm test:related path/to/source.ts
pnpm test:changed
pnpm test:storybook src/6-shared/ui/kit/InlineField.stories.tsx
```

`test:related` and `test:changed` use Vitest's dependency graph. They save time,
but neither command claims to select every policy-required regression or manual
smoke. Do not repeat a successful broad gate while its inputs are unchanged.

Android system Back has an additional targeted check using Chromium with an
Android user agent and real `CloseWatcher` events, in both themes:

```sh
STORYBOOK_ANDROID=1 pnpm test:storybook src/6-shared/ui/kit/DrawerBack.stories.tsx
```

This exercises the Android-only library handler; it is not a physical-device
or Android system-gesture test. The default `verify:ui`, `verify:all` and CI
runs use a desktop user agent and do not exercise this handler; run the command
above separately when changing system Back behavior.

## Handoff routing

| Changed surface                          | Final verification                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| Documentation only                       | Touched-file Prettier plus `pnpm verify:whitespace`                             |
| Application, Core, store, or local tool  | Focused contract tests, then `pnpm verify`                                      |
| UI, styles, stories, or UI configuration | `pnpm verify` plus task-relevant stories in both themes                         |
| Cross-cutting or dependency change       | `pnpm verify`, `pnpm knip`, relevant stories; full UI only under the rule above |
| Replica persistence or sync              | `pnpm verify` plus the policy-required manual smoke                             |

The formatting commands enumerate tracked public files. Generated files and
lockfiles listed in `.prettierignore` are outside that formatting surface, and
untracked working files cannot make the shared gate fail.

Area-specific policies can require more evidence, never less:

- `src/zerro-core/support/documents/testing.md` — Core contracts and broad-test
  triggers;
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

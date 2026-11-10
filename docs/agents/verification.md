# Verification

Run focused checks while editing. Use the final gate for the changed surface once before handoff.

| Change                                  | Final gate                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Documentation only                      | Prettier on touched files and `pnpm verify:whitespace`                                                    |
| App, Core, store or local tool          | Focused contract tests and `pnpm verify`                                                                  |
| UI, styles, stories or UI configuration | `pnpm verify` and task-relevant stories in both themes                                                    |
| Cross-cutting or dependency changes     | `pnpm verify`, `pnpm knip` and relevant stories                                                           |
| Replica persistence or sync             | `pnpm verify` and the [Core manual smoke](../../src/zerro-core/support/documents/testing.md#manual-smoke) |

`pnpm verify` checks whitespace, tracked-file formatting, CSS, JS, TypeScript and the complete unit suite. `pnpm test:related` and `pnpm test:changed` use the dependency graph and can miss required regressions. `pnpm verify:ui` builds the app and Storybook and runs the full browser suite. `pnpm verify:all` runs both tiers plus Knip.

## Test design

Assert current observable behavior. Remove assertions for intentionally retired features. Avoid tests for the absence of historical source text, styles, props or controls. A dialog disappearing after Back is a current interaction outcome. For changes to Core, see the [contract matrix](../../src/zerro-core/support/documents/testing.md).

## Browser checks

Keep file isolation and the configured two-worker limit. Run the relevant story files in light and dark themes, including direct consumers of shared components. An unfiltered browser run requires an explicit user request or a genuinely global change, such as app-wide theme tokens or shared overlay infrastructure. Explain that scope first.

```sh
pnpm test:storybook src/6-shared/ui/kit/InlineField.stories.tsx
STORYBOOK_ANDROID=1 pnpm test:storybook src/6-shared/ui/kit/DrawerBack.stories.tsx
STORYBOOK_REDUCED_MOTION=1 pnpm test:storybook src/3-widgets/transaction/TransactionList/TopBar/Filter.stories.tsx
```

Run the Android command for system Back changes. It exercises Chromium's native `CloseWatcher` with an Android user agent. A physical system gesture requires a device check. Use the reduced-motion setting for motion-sensitive stories.

For service-worker or offline asset changes, run `pnpm test:pwa`. It builds and installs the production app in fresh light and dark contexts, disables network and HTTP cache, checks bundled resources and opens previously unvisited pages and a shortcut.

## CI

Pull requests and pushes to `master` or `beta` run the baseline. A dependent UI job runs for UI-relevant paths, including Core consumed by fixture-backed stories. See the [workflow](../../.github/workflows/verify.yml) for exact path filters. Rerun browser server or transport failures in a working environment before classifying the result.

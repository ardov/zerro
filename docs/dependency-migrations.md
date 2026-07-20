# Dependency migration plan

- Updated: 2026-07-14
- Scope: application runtime and development toolchain
- Rule: one independently verified migration per commit

This document records the order and verification contracts for dependency
major upgrades. Routine compatible updates remain separate from these steps.

## Order

### 1. Restore useful tooling gates — completed 2026-07-14

- Make `lint:css` lint CSS and SCSS sources rather than parsing TypeScript as
  CSS.
- Make the default Knip command a blocking dependency gate.
- Keep unused-export discovery as a separate audit because exports require
  ownership decisions and are not safe to delete mechanically.
- Remove dependencies that the dependency gate proves unused.

Exit: TypeScript, ESLint, Stylelint, the Knip dependency gate, formatting,
Vitest, package-check, build, and `git diff --check` pass.

Result: Stylelint uses an SCSS-aware configuration and checks only CSS/SCSS
sources. `pnpm knip` checks dependency issues, while `pnpm knip:exports` keeps
the non-blocking export audit visible. The unused `prop-types` dependency and
the redundant direct base Stylelint config were removed.

### 2. Vite 8 and the React plugin — completed 2026-07-14

- Upgrade Vite and `@vitejs/plugin-react` together.
- Keep MDX, path aliases, the web worker, and PWA generation on their existing
  public plugin APIs.
- Verify development startup in addition to the production build when possible.

Exit: tests run on Vite 8, the production bundle and service worker build, and
the worker entry remains present in the output.

Result: Vite 8 and React plugin 6 build the application, MDX, worker, and PWA.
Vite's native `resolve.tsconfigPaths` replaced the redundant
`vite-tsconfig-paths` plugin. The local development server starts and serves the
application shell.

### 3. ESLint 10 — completed 2026-07-14

Upgrade `eslint` and `@eslint/js` together, then verify every configured plugin
against ESLint 10. Accept or override new recommended rules explicitly.

Result: ESLint 10 runs with TypeScript ESLint and the officially compatible
React Hooks plugin. The general `eslint-plugin-react` dependency was removed:
ESLint 10 tracks JSX references, TypeScript checks JSX types, and the old plugin
did not declare ESLint 10 support. New core diagnostics were fixed rather than
suppressed.

### 4. React Router 5 to 6 — completed 2026-07-20

First migrate only the existing declarative routing model. Replace `Switch`,
`Redirect`, `useHistory`, and `useRouteMatch`, then remove the direct `history`
dependency when no application code owns a custom history object.

Do not combine this step with a data-router rewrite.

#### Back-button dialog contract

Dialogs, drawers, menus, and popovers registered through `registerPopover` are
stored as a stack in `location.state.dialogs`. Opening one pushes a same-URL
history entry and closing one navigates back through that stack.

Before changing Router APIs, add regression coverage proving that:

1. opening a registered overlay keeps `pathname`, `search`, and `hash` intact;
2. browser Back closes the top overlay without leaving the current page;
3. nested overlays close one at a time in last-opened-first-closed order;
4. an overlay's `onClose` action has the same history result as Back;
5. Back navigates to the previous page only after the overlay stack is empty;
6. Forward restores an overlay only if restoring history-backed UI remains the
   accepted product behavior.

Automated coverage now pins the current history behavior, including same-URL
state pushes, nested Back handling, explicit close, and Forward restoration. It
also caught and fixed query/hash reordering in overlay history entries. The
Router 6 migration now uses `BrowserRouter`, `Routes`, `Navigate`, and the
navigation/location hooks without an application-owned history object. The
direct `history`, `react-router`, and legacy `@types` dependencies are gone.
Analytics follows Router location changes, and the v7 compatibility flags are
enabled ahead of the next major migration. The same overlay contract passes on
Router 6; browser smoke confirmed that Back closes the real Settings overlay
without leaving `/budget`, and the console remains clean.

### 5. React 19 — completed 2026-07-14

Upgrade `react`, `react-dom`, their types, and React-sensitive test utilities as
one compatibility slice. Recheck refs, effects, dialogs, portals, and Strict
Mode behavior. The app already uses `createRoot` and the modern JSX transform.

Result: React and React DOM 19 are installed with matching types. React 19 type
changes were applied to refs, JSX element types, DOM prop intersections, and
element cloning. `react-helmet` was replaced by the React 19-compatible
`react-helmet-async` provider. The history-backed overlay contract passes on
React 19.

### 6. Material UI 9 and MUI X 9 — completed 2026-07-20

Upgrade Material UI, icons, system, and date pickers together. Run supported
codemods in small groups and manually verify dialogs, menus, popovers, tabs,
theme overrides, and date localization.

Result: Material UI, icons, system, and X date pickers now use their current
9.x releases. The official system-props codemod moved removed layout props to
`sx`; wrapper seams and Tooltip's removed `PopperProps` API were migrated
manually. TypeScript, tests, production build, and package check pass. Browser
smoke covers history-backed Settings menu closing, transaction preview, and the
localized date picker calendar with a clean console.

### 7. React Router 6 to 7 to 8

Adopt supported compatibility flags on each intermediate major. Do not jump
directly from Router 5 to the current major. Keep declarative routing unless a
separate product requirement justifies data routers.

Router 7 is completed 2026-07-20. The previously enabled v7 future behaviors
are now defaults, so their `future` props were removed. Declarative routes and
the history-backed overlay contract remain unchanged; TypeScript, tests, build,
and package check pass. Router 8 remains a separate next step; as of
2026-07-20, the npm stable channel ends at `react-router-dom` 7.18.1, so do not
use a prerelease merely to advance this plan.

### 8. TypeScript 7

Take this last because compiler and module-resolution changes affect the whole
repository, ESLint parsing, Vite config, and the Zerro Core declaration
consumer. Keep package-check as a blocking gate.

## Smaller major upgrades

Take narrow majors such as `uuid`, i18next, globals, and Stylelint between the
larger steps. They should not share commits with React, Router, MUI, Vite, or
TypeScript migrations.

## Verification template

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm lint:js
pnpm lint:css
pnpm knip
pnpm exec vitest run
pnpm zerro-core:package-check
pnpm build
pnpm format:check
git diff --check
```

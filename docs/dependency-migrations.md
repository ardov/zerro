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

### 3. ESLint 10

Upgrade `eslint` and `@eslint/js` together, then verify every configured plugin
against ESLint 10. Accept or override new recommended rules explicitly.

### 4. React Router 5 to 6

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

The Router migration is incomplete until this contract passes in an automated
test and in a browser smoke test on a real dialog.

### 5. React 19

Upgrade `react`, `react-dom`, their types, and React-sensitive test utilities as
one compatibility slice. Recheck refs, effects, dialogs, portals, and Strict
Mode behavior. The app already uses `createRoot` and the modern JSX transform.

### 6. Material UI 9 and MUI X 9

Upgrade Material UI, icons, system, and date pickers together. Run supported
codemods in small groups and manually verify dialogs, menus, popovers, tabs,
theme overrides, and date localization.

### 7. React Router 6 to 7 to 8

Adopt supported compatibility flags on each intermediate major. Do not jump
directly from Router 5 to the current major. Keep declarative routing unless a
separate product requirement justifies data routers.

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

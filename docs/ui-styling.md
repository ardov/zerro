# UI conventions

## Themes and tokens

The app loads [index.css](../src/index.css). Storybook uses the same components and theme with [a wider Tailwind source scan](../.storybook/tailwind.css). Put component CSS in `@layer components` so utilities can override it. Shared typography and spacing live in [tailwind.css](../src/tailwind.css).

[Kit theme.css](../src/6-shared/ui/kit/theme.css) owns semantic colors, geometry, stacking and interaction roles. Use `ui-highlight` for hover, `ui-pressed` for press, `ui-selected` for persistent selection and `ui-focus` for keyboard focus. Pair solid status surfaces with their on-solid foreground. Use `getContrastText` for a dynamic background. Charts, warnings and snackbars also consume the generated [color scales](../src/6-shared/ui/theme/colors.ts).

[theme-init.js](../public/theme-init.js) applies the scheme before paint. An explicit choice matching the system removes the override. Use `window.themeManager` for preference changes and `AppThemeProvider.defaultMode` to pin an isolated renderer. Fonts ship with the app. After service-worker installation, bundled graphics and fonts are available offline. [External merchant favicons have their own cache](../src/6-shared/favicon-cache/README.md).

## Layout and scrolling

The [page column manifest](../src/1-app/pageColumns.ts) lists columns in visual order. The primary column has no collapse order and can shrink below its minimum when alone. Optional columns drop in order as space runs out. Use the [layout resolver](../src/6-shared/ui/layout/columnLayout.ts) for available space and the named theme breakpoints for media queries. CSS and JS breakpoints use pixels so changing the root font size keeps them aligned. Kit surfaces have their own [bottom-sheet policy](../src/6-shared/ui/kit/useBottomSheetLayout.ts).

- Use `Panel` when children own a scroller and `PanelScrollable` when the panel owns it. The scrollport fills the surface. Put padding on the content or rows so sticky headers reach the edges.
- Give flex ancestors `min-h-0` or `min-w-0` on the scrolling axis. A clipping wrapper between a sticky header and its scroller changes which ancestor it sticks to.
- Keep fixed headers outside an edge-faded `ScrollArea`. For a virtual list pass its actual viewport to the virtualizer. `insetTop` reserves native scroll padding and scrollbar space. Content reserves its own leading space.
- `CanvasPage` includes the mobile navigation inset inside its scrollable content. Panels end above navigation. Drawer content consumes its own bottom safe area, or a pinned footer consumes it for the content above.
- `AdaptivePanel` keeps a stable mounted editor and scrollport when switching between a column and a drawer. [List/Details ownership](adr/0003-list-details-screen-instances.md)

## Overlays, focus and motion

Mount `OverlayHost` inside the router. Use `usePopup` for trigger-owned popups, `useAsk` for a result and `defineScreen` or `defineScreenInstances` for restorable views. Each opening has one history owner. When an owner already exists, render a `*Surface` with its controller. Trigger-based kit components register their own popup unless passed one. Select and MultiSelect follow the same rule.

Back dismisses the top layer. Android drawer `CloseWatcher` callbacks also go through the host so a nested picker closes first. Covered drawers stay mounted and relinquish focus trapping. Closing a child returns focus to its live opener or the newly active surface. A link in a menu lets route navigation close the menu, avoiding a competing Back step.

Give every surface an accessible title or label and every icon-only button a name. Tooltips describe controls on hover or keyboard focus. Destructive confirmations initially focus Cancel. Pair spatial transitions with a reduced-motion treatment and make exiting interactive content inert.

Use the kit toast manager for transient action results. Persistence and recovery warnings remain visible as declarative notices. Component-specific props, examples and interactions live with the [UI Kit stories](../src/6-shared/ui/kit/README.md).

## Storybook

Colocate component stories with their source. The **UI Kit** tree covers controls and foundations, **App** covers fixture-backed workflows, and **Library** and **Foundations** also contain shared examples. Set theme and locale through the toolbar. [Story providers and ordering](../.storybook/preview.tsx)

Test the observable interaction in both themes and on either side of its responsive boundary. See the [verification matrix](agents/verification.md) for browser commands, Android Back and reduced motion.

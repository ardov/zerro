# UI styling

Zerro's interface is built with Tailwind CSS v4, Base UI primitives and a
small set of application-owned React components under `src/6-shared/ui`.
Storybook uses the same theme, tokens and component implementations as the
application.

## Entry points and cascade

The application loads `src/index.css`. It imports `src/tailwind.css`, scans the
application source, and excludes stories and tests from the production utility
set. Storybook loads `.storybook/tailwind.css`, which scans both application
source and stories while excluding tests.

The cascade order is explicit:

```css
@layer theme, base, components, utilities;
```

- `theme` contains Tailwind's theme variables.
- `base` contains the document reset and scrollbar defaults from
  `src/6-shared/ui/theme/styles.css`.
- `components` contains co-located component and route styles.
- `utilities` contains Tailwind utilities.

Tailwind Preflight is disabled. Global element defaults therefore belong in
`styles.css`, which applies [Josh W. Comeau's Custom CSS
Reset](https://www.joshwcomeau.com/css/custom-css-reset/), plus the
application's theme and scrollbar defaults. Route and component rules should
not recreate document-wide resets. Component CSS must be placed in `@layer
components` so utilities can override it predictably.

## Theme boot and persistence

`public/theme-init.js` runs before the application bundle. It:

- reads the color-scheme preference from local storage key `theme`;
- accepts `light`, `dark`, or `system`, including JSON-encoded string values;
- follows the operating-system preference when no explicit override is stored;
- applies the root `.dark` class and the matching `color-scheme` before paint;
- exposes `window.themeManager` for reading, toggling and subscribing.

The toggle stores only an override. When the selected scheme matches the system
scheme, the key is removed and the application resumes following the system.
Storage failures fall back to memory for the current page.

`AppThemeProvider` injects both generated CSS token blocks. Its `defaultMode`
prop is reserved for isolated renderers such as Storybook; the application
leaves it unset so `themeManager` remains the owner of preference.

## Color scales and tokens

`src/6-shared/ui/theme/colors.ts` is the single authoring surface for theme
colors. It contains:

- continuous `ColorScale` instances for the concrete hue families;
- semantic scale names such as `primary`, `interactive` and `error`;
- one table of visual lightness levels for each resolved color scheme;
- one flat token factory evaluated once for `light` and once for `dark`;
- serialization of the `:root` and `:root.dark` blocks and the browser
  `theme-color` value.

A token formula selects a semantic scale and a visual role. For example, the
same `BORDER` level can be sampled from neutral, primary or error without
copying numbered shades between separate palettes. Small optical corrections
remain ordinary arithmetic beside the affected token. The factory may also use
a literal when the scale abstraction would make a local decision less clear.

Opaque samples use `scale.at(level)`. Transparent light-scheme samples use
`scale.opaqueAt(level)` and dark-scheme samples use
`scale.opaqueInvAt(level)`. These use white and black as reference surfaces;
the Theme Showcase is where scheme-specific corrections are judged.

`src/tailwind.css` maps the generated properties onto semantic Tailwind colors
via `@theme inline { --color-*: var(--*) }`. Typography recipes, elevation
shadows, stacking levels and corner radii use native Tailwind theme namespaces
(`--text-*`, `--shadow-*`, `--z-index-*` and `--radius-*`), so no custom
`@utility` blocks are needed. The radius scale is declared in pixels and
descends from an 8px `rounded-lg`; the namespace is cleared first, so the
registered steps are exactly the ones the stylesheet lists.

Use semantic utilities such as `bg-background`, `text-muted-foreground`,
`border-border-strong`, `shadow-elevation-8` and `z-modal`. Typography
recipes are `text-body`, `text-body-sm`, `text-caption`, `text-overline`,
`text-title`, `text-title-lg` and `text-display`; `text-overline` sets size,
line height and weight but not `text-transform`, so pair it with `uppercase`
at the call site. Charts and SVGs read the same generated custom properties
directly when a CSS utility cannot reach their API. Feature code must not
import the scales or semantic levels. Avoid duplicating token values in
arbitrary classes; add a role to the flat factory when multiple consumers need
the same decision.

Several `--color-*` aliases are intentionally retained even though current
source scanning does not find a consumer. They are marked by a comment in
`src/tailwind.css`; do not silently remove or expand that set.

Two numeric tokens are not colors. The disabled-control opacity is declared in
the `--opacity-*` namespace, so it reads as `opacity-disabled` and composes
with variants such as `disabled:` and `aria-disabled:`. The switch track
opacity differs between schemes, so the switch component consumes it directly
as an arbitrary value.

`Foundations/Theme` in Storybook is the visual calibration surface. It shows
the concrete and semantic scales, the scheme's neutral levels, status roles,
interaction states, representative controls and chart colors in both themes.

## Breakpoints

`src/6-shared/ui/theme/breakpoints.ts` is the TypeScript source of truth:

| Name |  Width |
| ---- | -----: |
| `xs` |    0px |
| `sm` |  600px |
| `md` |  900px |
| `lg` | 1200px |
| `xl` | 1536px |

`src/tailwind.css` mirrors these values in pixels. Pixel units are deliberate:
the CSS variants and `useBreakpointDown` must agree even when the browser's root
font size is not 16px. A down query ends 0.05px before its boundary, preventing
both sides of a breakpoint from matching simultaneously.

Use `useBreakpointDown` for the named application breakpoints.
`useMediaQueryValue` is for media features that are not layout breakpoints,
such as color-scheme or input-capability queries.

## Typography and spacing

The application font is IBM Plex Sans. Typography recipes are defined as
compound `--text-*` theme variables in `src/tailwind.css`. Each variable sets
size, line height and weight together, generating native Tailwind utilities:

- `text-body`
- `text-body-sm`
- `text-caption`
- `text-overline` (pair with `uppercase` — the theme variable does not set
  `text-transform`)
- `text-title`
- `text-title-lg`
- `text-display`

Apply margins and text color separately at the call site. Because compound
`text-*` recipes share the font-size namespace in `tailwind-merge`, competing
recipes passed through `cn()` resolve in favor of the last one.

Tailwind spacing units are 4px. Prefer named utilities and explicit `gap` on
layout containers. Use arbitrary values only when the component contract calls
for a value outside the shared scale.

## Class composition and shadcn files

Use `cn()` from `src/6-shared/ui/shadcn/utils.ts` when class names are
conditional or need ordinary Tailwind conflict resolution. `components.json`
and the `shadcn` directory are part of the current tooling boundary and should
remain in place.

Keep in mind that `cn()` cannot infer conflicts between custom utilities. A
component API should select one recipe before calling `cn()` rather than append
several mutually exclusive recipes.

## Shared component contracts

The components in `src/6-shared/ui` intentionally expose only the variants and
behaviors used by Zerro. Extend their public props when a real call site needs a
new contract; do not add speculative combinations.

Important groups include:

- Buttons and links: `Button`, `IconButton`, `ButtonBase`, and `Link` own the
  reset, focus-visible treatment, geometry and semantic color variants.
- Rows and menus: `ListRow`, `ActionList`, and `Menu` provide keyboard,
  typeahead, selection and disabled-row behavior for action surfaces.
- Fields: `OutlinedField`, `InputBase`, `GrowingTextarea`, `Select`,
  `MultiCombobox`, and date controls own labels, adornments, focus, error and
  disabled states.
- Feedback: `Checkbox`, `Switch`, `Chip`, `Tooltip`, `CircularProgress`,
  `SnackbarProvider`, and `SnackbarNotice` own their complete visual state.
- Disclosure and overlays: `Collapse`, `Dialog`, `SideDrawer`, `Popover`,
  `AdaptivePopover`, `AdaptiveDialog`, and `Confirm` own focus, dismissal,
  transition and portal behavior.

Prefer native semantics. Interactive rows and links should remain real buttons
or anchors; decorative controls must not become accidental tab stops.

## Overlay behavior

Overlay components portal to the document body and share the stacking tokens
`z-drawer`, `z-modal`, and `z-tooltip`. They come from `--z-index-*` in
`src/tailwind.css`, so they do not depend on a mounted provider.

`Popover` and `Menu` position against an element or virtual anchor and use the
shared surface geometry in `overlaySurface`. `SideDrawer` is a modal sheet.
`NavDrawer` is the separate docked navigation layout. `AdaptivePopover` and
`AdaptiveDialog` select the appropriate surface for the current viewport
without changing the caller's open-state contract.

Every one of them takes `open` and `onClose` and owns neither. Openness belongs
to `6-shared/overlays`, which is the only place that touches browser history:
`usePopup` for a surface with its own trigger, `useAsk` for one that is asked a
question, `defineScreen` for one a person can come back to. A surface that
holds its own `useState` for openness is a Back press that leaves the page.

When an overlay opens another overlay, preserve the opener's history and focus
contract: closing the child returns focus to the child trigger; closing the
parent returns focus to the parent trigger. `useOverlayFocus` contains the
shared focus helpers.

Transitions must have a reduced-motion variant. Reduced motion may keep an
opacity change when it conveys visibility, but must remove spatial movement and
decorative transforms.

## Component CSS

Use co-located CSS for behavior that utility classes cannot express clearly,
including data-state transitions, notched field geometry, and keyframes. Class
names describe the current component or motion (`collapse-panel`,
`dialog-fade`, `drawer-slide`, `popup-grow`, `circular-progress`) rather than
their implementation history.

State selectors should use component data attributes where possible. Keep
transition timing in CSS and interactive state in React; hidden interactive
surfaces must be inert and excluded from accessibility navigation.

## Icons

Application icons are exported from `src/6-shared/ui/Icons.tsx`. Feather glyphs
are created through `src/6-shared/ui/feather/createFeatherIcon.tsx`, which keeps
size, color and accessibility handling consistent. Add a semantic export to the
barrel instead of importing an icon package throughout feature code.

## Storybook and checks

Stories use the same `AppThemeProvider`, locale providers and Tailwind source as
the application. Cover both color schemes when a token-sensitive component is
introduced or changed, and use the 899px/900px viewports for behavior that
switches at `md`.

Useful checks:

```sh
pnpm verify
pnpm verify:ui
pnpm verify:all
```

Run focused component or theme tests while developing. `verify:ui` is the
additional app/Storybook gate after the baseline `verify`; `verify:all` composes
both and adds the dependency audit. The routing matrix lives in
`docs/agents/verification.md`.

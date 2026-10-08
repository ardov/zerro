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

The cascade order is declared in the app and Storybook HTML heads before
component CSS loads:

```css
@layer theme, base, components, utilities;
```

- `theme` contains Tailwind's theme variables.
- `base` contains Tailwind Preflight and application defaults from
  `src/6-shared/ui/theme/styles.css`.
- `components` contains co-located component and route styles.
- `utilities` contains Tailwind utilities.

Tailwind Preflight provides the document reset. Global application defaults
belong in `styles.css`.
Route and component rules should not recreate document-wide resets. Component
CSS must be placed in `@layer components` so utilities can override it
predictably.

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

## Dynamic color input and foregrounds

Choose dynamic foreground colors through `getContrastText` from
`6-shared/helpers/color`; do not add local contrast heuristics.

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
`useMediaQueryValue` supports media features and component-specific layout
policies. Keep a shared component policy in one named hook. UI Kit Drawer and
Menu use `useBottomSheetLayout`: bottom sheets below 500px, independently of
the application's `md` layout breakpoint. Explicit Drawer sides override it.

## Canvas, panels and scrolling

The logged-in layout is a canvas (`--background`) with panels (`--card`) on it.
`src/6-shared/ui/layout/panelWidths.ts` holds the minimum widths of the rail,
the canvas gap and each panel. A page decides its arrangement by asking
whether the window fits a set of panels side by side (`useWindowFits`). It
does not use a named breakpoint for this. A panel that does not fit opens as
a drawer instead, or is not shown.

A scrolling surface follows four rules. Each one prevents a specific artifact:

- **The scroller fills the surface.** The scroll edge is the surface's edge:
  a `ScrollArea` root is the surface, with its background and radius, and its
  viewport fills it. Padding on a non-scrolling wrapper around a scroller
  moves the scroll edge inside the visible surface. Content then vanishes at
  an invisible line instead of passing under the edge.
- **Padding lives inside the scroll.** A scroller takes no horizontal padding.
  Its content or its rows carry it. A sticky element cannot leave its parent's
  content box, so padding on the scroller insets every sticky header.
- **Nothing between a sticky element and its scroller clips.** A sticky
  element sticks to its nearest ancestor with an `overflow` other than
  `visible`. An `overflow: hidden` wrapper added for rounding becomes that
  ancestor, and it never scrolls. A sticky element's parent should also span
  the whole scrolled content, or the element leaves with it.
- **Overlaps are insets inside the scroll.** The bottom bar measures how much
  of the window it covers, and the layout sets that as `--bottom-inset` on
  the canvas, so every page scroller sees it and no overlay does. `Panel` is
  a kit `ScrollArea` with `bottomInset`: the inset goes at the end of the
  content, into `scroll-padding-bottom` and under the thumb's track. Content
  then scrolls on under the bar instead of stopping above it. A panel whose
  content brings its own scroller, such as a virtual list, sets
  `contentScrolls` and gives that scroller `scrollInsetClass`.

Every flex ancestor between `h-dvh` and a scroller needs `min-h-0` (or
`min-w-0` across). Without it the item grows to its content, and the window
scrolls instead of the panel.

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
- Rows and menus: `ListRow`, `ActionList`, and kit `Menu` provide keyboard,
  typeahead, selection and disabled-row behavior for action surfaces.
- Fields: kit `Input`, `Textarea`, `InlineField`, `Select`/`MultiSelect`, and
  date controls own labels, adornments, focus, error and disabled states.
- Feedback: `Checkbox`, `Switch`, `Chip`, kit `Tooltip`, `CircularProgress`,
  `SnackbarProvider`, and `SnackbarNotice` own their complete visual state.
- Disclosure and overlays: `Collapse` and kit `Dialog`, `Drawer`, `Popover`,
  `Menu` and `Confirm` own focus, dismissal, transition and portal behavior.

Kit `Tooltip` opens on hover and focus only, and it does not name its trigger:
the control owns its accessible name, so an icon-only button takes the same
text as its `aria-label`. A tooltip does not open on touch.

Prefer native semantics. Interactive rows and links should remain real buttons
or anchors; decorative controls must not become accidental tab stops.

## Overlay behavior

Overlay components portal to the document body and share the stacking tokens
`z-drawer`, `z-modal`, and `z-tooltip`. They come from `--z-index-*` in
`src/tailwind.css`, so they do not depend on a mounted provider.

Openness belongs to `6-shared/overlays`, which is the only place that
touches browser history: `usePopup` for a surface with its own trigger,
`useAsk` for one that is asked a question, `defineScreen` for one a person can
come back to. A surface that holds its own `useState` for openness is a Back
press that leaves the page.

### Kit surfaces

Kit `Dialog`, `Popover`, `Drawer` and `Menu` accept a `trigger` and own a
`usePopup` registration internally. Pass `popup={usePopup()}` for programmatic
control. `usePopup(onClose?)` returns an explicit controller with `open`,
`setOpen`, `subscribeClose`, and `release`. `setOpen` is an ordinary callback;
wrapping it does not change lifecycle behavior.

`DialogSurface`, `PopoverSurface`, `DrawerSurface` and `MenuSurface` only render an existing
owner's `controller`. They use its `open` and `setOpen`; they do not register
history or subscribe to closing. For an asked editor, pass the `controller`
returned by `useAsked(onClose?)`. A plain `{ open, setOpen }` is also accepted
for rendering, but the caller must provide its own history and lifecycle.
`DrawerSurface` requires `OverlayHost` even with a plain controller, because
system Back is dispatched through the host. This also applies to the drawer
presentations of Dialog, Popover and Menu. Their owners must register in that
same host so Back can identify the top layer. Do not register the same opening
twice.

Android system Back can reach a Drawer through Base UI's `CloseWatcher` even
when a Select is above it. `DrawerFrame` routes that reason through
`useOverlayBack`: the host dismisses the top popup or screen and ignores
additional native requests while its history step is pending. The originating
Drawer's own dismissal is canceled; its visibility still follows its owner.
Escape, backdrop, swipe and explicit close retain their surface-specific behavior.

A menu with its own button is a kit `Menu`. A context menu opened from an
event, such as a right click on a list row, is asked: its component renders
`MenuSurface` with the `controller` from `useAsked()` and a point anchor, and
answers nothing. In both, selecting an item closes the menu, then runs its
`onSelect`. A checkbox item keeps the menu open. A `link` item navigates with
the router and leaves closing to the navigation: closing first would be a Back
step racing the push. Answers belong to surfaces that ask a question: a confirmation, a
date, a colour.

```tsx
<Dialog title="Details" trigger={<Button>Open</Button>} mobile="drawer">
  <Details />
</Dialog>

<Popover label="Period" trigger={<Button>Period</Button>}>
  <PeriodPicker />
</Popover>
```

`children` is free content. Optional `title` supplies a visible heading and an
accessible name; without it, `label` is required. `className` styles the panel.
The body scrolls in a kit `ScrollArea` that fills the rest of the panel;
`contentClassName` is the padding and layout of the content inside that
scroll. A Drawer whose children bring their own scroller, such as a virtual
list, sets `contentScrolls`: the body is then a plain column they fill.
Centered Dialog shows a close button by default (`closeButton={false}` hides
it). Bottom drawers, Popover and Confirm have no visible close button; the
surface owns this rule, so forms do not need breakpoint logic. Popover accepts `anchor`, `side`, and `align`; its anchor controls position,
while the trigger controls focus restoration. It is modal.

Dialog and Drawer render their own dimming backdrops, including nested surfaces.
Anchored Popover keeps a transparent backdrop: it remains modal without dimming
the page. Its mobile Drawer presentation retains the Drawer backdrop.
Dialog, Drawer and modal Popover share `z-modal`; portal order places each child's
backdrop above the parent and below the child. Base UI's nested-backdrop
suppression is disabled for Dialog/Drawer. Popover and bottom Drawer retain a
screen-reader close control without an icon; Popover also needs that primitive
for Base UI's modal focus trap.

Below **500px**, Popover and Menu default to `mobile="drawer"`; use
`mobile="popover"` to keep them anchored. Dialog stays centered by default
(`mobile="dialog"`) and supports `mobile="drawer"`. Drawer uses
`side="auto" | "bottom" | "right"`. Shared application breakpoints are unchanged.
From 500px, right drawers use the theme token `--spacing-ui-drawer-inset` (4px)
on all viewport edges and round every corner; below 500px a right drawer fills
the screen as a page, without inset or radius. Bottom drawers remain flush with
the viewport and round only their top corners.
Adaptive branches can remount content and lose local input. Keep important drafts
above those branches. Switching presentation neither closes nor adds history.

Dialog/Drawer use `bg-ui-card`; anchored Popover/Menu use `bg-ui-popover`.
Shadow is independent from the fill. Surfaces follow the visual viewport so their
scrollable content stays accessible above the software keyboard.

**Surfaces cannot veto closing through Back.** `onClose` is a notification,
not permission to close; return values and promises do not block history.
Register it once in the stable owner: `usePopup(onClose)`, `useAsked(onClose)`,
or `screen.use(onClose)`. Keep that owner and its draft above conditional or
adaptive surface content. Popup/asked owners are notified at close start;
screen owners observe the committed transition to a closed history state.
Subscriptions are removed immediately when their owner unmounts.

The convenience `Dialog`, `Popover` and `Drawer` also accept `onClose` when they
are the stable owner. Do not register the same save callback on both the hook
and the convenience component. Rendering-only Surfaces have no `onClose` prop.
Technical unmount and adaptive remount do not save drafts; closing the browser
has no save guarantee. No close guard is implemented.

An editor can hold a local draft and commit a changed valid value in `onClose`.
It owns validation and error handling. Never save from effect cleanup.
Save/Cancel forms save only on explicit submission. Pending operations must not
require their window to remain open. The component stories demonstrate close notification and explicit Save/Cancel
separately. The transaction editor uses kit fields, selection controls, menus
and an adaptive `DrawerSurface`; its existing popup or screen owns history.
The editor opens as a full-width bottom sheet below 500px and a right drawer
on wider screens. Its date and time inputs retain native segmented editing.
Other application editors may still use legacy surfaces.

`Confirm` is passed to `useAsk<boolean>()`. Explicit confirmation answers `true`;
all dismissals answer `undefined`. `intent="danger"` uses AlertDialog semantics,
a destructive action and initial focus on Cancel. Ordinary confirmation initially
focuses the confirming action. All application confirmations use the kit Confirm.

When an overlay opens another overlay, preserve the opener's history and focus
contract: closing the child returns focus to the child trigger; closing the
parent returns focus to the parent trigger. `useOverlayFinalFocus` contains the
shared focus helpers.

A field shows its focus ring for any focus in its text, and for keyboard focus
on a trigger. A popup closed by a pointer returns focus to its trigger by
script, and Chrome still treats that focus as visible. `inputModality.ts`
records the last kind of input on the root as `data-input-modality`, and the
`field-focus` variant in the kit theme keeps such focus quiet.

Transitions must have a reduced-motion variant. Reduced motion may keep an
opacity change when it conveys visibility, but must remove spatial movement and
decorative transforms.

### Scrolling

Surfaces scroll in the kit `ScrollArea` (`src/6-shared/ui/kit/ScrollArea.tsx`):
the thumb shows only while the area is hovered or scrolled, the viewport is
never a tab stop, and the area scrolls only vertically. Drawers and dialogs
use the thumb. The kit `Menu` and `Popover` use `scrollbar="none"` with
`fade` (a popover shown as a bottom sheet on a phone is a drawer and uses the
thumb), a mask over the content at an edge with more past it. The mask covers everything
that scrolls, sticky headers included, so a surface with `fade` keeps its
header above the area rather than inside it; its scroll padding keeps a row
brought into view clear of the fade.

The content has its natural height, so percentages inside it have nothing
to resolve against. To pin a footer to the bottom of short content, the
content takes `flex min-h-full flex-col` and the footer `mt-auto`.

Two scrollers stay native, with the scrollbar hidden. `ListPanel` scrolls the
list primitive's own element, which owns scroll-to-selected and keyboard
navigation; a ScrollArea viewport rendered as that element would replace its
listbox role. The transaction list is virtualized by react-window, whose list
element is its own scroller and takes no outside ref.

## Component CSS

Use co-located CSS for behavior that utility classes cannot express clearly,
including data-state transitions, notched field geometry, and keyframes. Class
names describe the current component or motion (`collapse-panel`,
`kit-surface-fade`, `kit-drawer-popup`, `kit-edge-fade`) rather than their
implementation history.

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
switches at `md`; kit bottom sheets use the 499px/500px viewports.

Useful checks:

```sh
pnpm verify
pnpm test:storybook src/6-shared/ui/kit/InlineField.stories.tsx
```

Run only task-relevant stories in both themes with the configured two-worker
limit. Include direct consumers of a changed shared component. Full browser
runs (`verify:ui`, `verify:all`, or unfiltered `test:storybook`) are reserved for
an explicit user request or genuinely global UI changes. Explain the global
impact before starting one. See `docs/agents/verification.md` for the routing
matrix; CI configuration is unchanged.

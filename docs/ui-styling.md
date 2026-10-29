# UI styling

Zerro's interface is built with Tailwind CSS, Base UI primitives and a
small set of application-owned React components under `src/6-shared/ui`.
Storybook uses the same theme, tokens and component implementations as the
application.

Keep concrete values and defaults in their owning source files. This document
describes contracts, ownership and reasons for rules; link to the source when
documenting where to tune appearance or behavior.

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

`public/theme-init.js` owns preference persistence and applies the color scheme
before the application paints. Consumers read, toggle and subscribe through
`window.themeManager` rather than maintaining a second preference store.

The toggle stores only an override. When the selected scheme matches the system
scheme, the key is removed and the application resumes following the system.
Storage failures fall back to memory for the current page.

`AppThemeProvider` injects both generated CSS token blocks. Its `defaultMode`
prop is reserved for isolated renderers such as Storybook; the application
leaves it unset so `themeManager` remains the owner of preference.

## Color scales and tokens

`src/6-shared/ui/kit/theme.css` authors the UI colors for both schemes.
Use semantic utilities such as `bg-ui-base`, `bg-ui-card`, `text-ui-primary`,
`text-ui-secondary` and `border-ui-border`. Tertiary text uses `ui-tertiary`;
input placeholders use the separate semantic role `ui-placeholder`.
Disabled controls use `opacity-ui-disabled` on the whole control.

Interaction colors have distinct roles: `ui-highlight` is a subtle surface or
hover layer, `ui-pressed` is a press layer, `ui-selected` is a persistent
selection, and `ui-focus` is the keyboard focus outline. Selection and hover
compose as separate layers in list controls such as Select. Budget and transaction
rows use a single layer: selected rows keep `ui-selected` during hover and press;
unselected rows use `ui-highlight` on hover, with no pressed fill or background
transition. Nested buttons keep their own interaction states.
`focusable` supplies the standard focus outline.

Status text and icons use `ui-success`, `ui-warning`, `ui-error`, or `ui-link`
for information. Solid status surfaces use `ui-{success,warning,info,error}-solid`
paired with `ui-on-{success,warning,info,error}`. These pairs are independent
from status text and chart colors. `UI Kit/Foundations` demonstrates the roles.
The browser `theme-color` follows the application scheme using literal sRGB
colors in `kit/themeColor.ts`. Keep these values aligned with Canvas in
`kit/theme.css` when changing the palette. The static `public/manifest.json`
uses the dark Canvas color for the PWA launch background and default theme color;
update those values manually when dark Canvas changes. The running application's
theme is independent of the launch background. Installed launch screens may keep
the manifest metadata captured by the browser at installation/update.

`src/6-shared/ui/theme/colors.ts` retains the generated palette consumed by
charts and legacy warning surfaces. Its values are evaluated once
for both schemes and injected by `AppThemeProvider`; `src/tailwind.css` exposes
only the retained aliases. Charts and SVGs can read those variables directly.
`Foundations/Theme` shows the retained scales alongside the UI Kit roles.
Feature code must not import scales or semantic levels.

Kit typography, shadows, stacking levels, radii and easing live in
`src/6-shared/ui/kit/theme.css`. Legacy application recipes remain in
`src/tailwind.css`. Typography and spacing usage is described below.

## Dynamic color input and foregrounds

Choose dynamic foreground colors through `getContrastText` from
`6-shared/helpers/color`; do not add local contrast heuristics.

## Breakpoints

`src/6-shared/ui/theme/breakpoints.ts` owns the named application breakpoints.
`src/tailwind.css` mirrors their values in pixels. Pixel units are deliberate:
the CSS variants and `useBreakpointDown` must agree even when the browser's root
font size changes. Down queries exclude the boundary, preventing both sides of
a breakpoint from matching simultaneously.

Use `useBreakpointDown` for the named application breakpoints.
`useMediaQueryValue` supports media features and component-specific layout
policies. Keep a shared component policy in one named hook.
`src/6-shared/ui/kit/useBottomSheetLayout.ts` owns the narrow-screen policy for
kit surfaces, independently of the app shell. Explicit Drawer sides override it.

## Canvas, panels and scrolling

The application shell uses Canvas (`ui-base`) behind panels (`ui-card`).
`src/1-app/pageColumns.ts` defines each page's columns: minimum,
optional maximum and collapse order. Every column grows from its required minimum
to its maximum; equal bounds fix its width, and no maximum means unlimited growth.
Each definition is an array in visual order. Exactly one column omits
`collapseOrder`: it is the primary, retained on mobile and never removed.
The other columns have numeric collapse orders, lowest first. `resolveColumns`
in `src/6-shared/ui/layout/columnLayout.ts`
selects columns at their minimum widths, removes optional columns until they
fit, and leaves sizing to CSS Flexbox. Each minimum is both the flex basis and
the growth weight. A capped column leaves further surplus to the others. The
rail has a fixed width and does not participate in column sizing. The primary
column can shrink below its minimum; a fully capped group is centered to the
right of the rail. Desktop panels have outer margins and gaps between columns,
without a gap after the rail. A single Accounts column uses the same mechanism.

`src/1-app/Layout.css` owns shell styles, safe-area variables and mobile
layout rules. Shared `layout.css` styles only columns and panel surfaces.

`Layout` measures the main content area after navigation and safe areas, then
provides the visible column set and definitions to page columns. The app supplies the column array;
omitting it gives an ordinary Canvas page. Page
components consume the result through `useColumns`. `Columns` gives each child
a flex container, in definition order; conditional children retain their slots.
The containers own width and visibility, while panels own surfaces and scrolling.
Widths adapt immediately to the available space, without waiting for a React
update after resize. Navigation lists Accounts
as a destination while the Transactions columns at the same width leave out the
Accounts column.

Column visibility changes animate the surface and the space it occupies.
Animation settings live in `src/6-shared/ui/layout/layout.css`.
Ordinary resizing between visibility thresholds stays immediate. Exit content retains
its last width and props until the transition finishes, then an adaptive editor
can move into its drawer without remounting. Exiting columns become inert
immediately; blur caused by hiding that column does not commit pending edits.
Portalled drawers retain ordinary blur/save behavior. Initial measurement does
not animate. Under reduced motion, flex space changes immediately and only
opacity fades.

The mobile shell is shared by panel and Canvas pages. `useMobileLayout` in the
shared layout module owns breakpoint selection; the shell's `data-mobile`
attribute drives its CSS too. A Panel
fills the area above navigation and scrolls internally. Ordinary Canvas content
fills the page's scrollport and can scroll underneath the same navigation. The
navigation includes the bottom safe area. Its Canvas gradient and masked
backdrop blur cover the full navigation height; visual settings live in
`src/3-widgets/Navigation/MobileNavigation.css`. The
shell reserves top, left and right safe areas in both orientations; desktop also
reserves the bottom safe area. Safe areas are separate from decorative panel
margins. Panel radius is shared across layouts; `--mobile-panel-top` and
`--mobile-panel-sides` control decorative mobile insets in `src/1-app/Layout.css`.

The optional history toolbar takes its natural height above both rail and page.
While mobile navigation is mounted, CSS reserves its height plus bottom safe
area for portalled toasts through `--toast-bottom-inset`.
Navigation actions stretch their transparent hit areas across the rail's width
or the bottom bar's full height, including its safe area. Each action centers a
40px tile with a 24px icon. The current destination uses `ui-selected` and a 2px
icon stroke; other icons use 1.5px. Hover highlights only the tile. Button press
motion applies to that tile through the shared `kit-press-trigger` rule while the
hit area stays fixed. Keyboard focus outlines the tile. Its `will-change: scale`
hint keeps the small animated surface ready for compositing; reduced motion
omits the hint and deformation. Sync remains a separate circular action with 24px icons.
`CanvasPage` provides the full-height scrollport; each page owns its content
width and padding.
`Panel` is a clipped surface for content with its own scroller, such as the
transaction list. `PanelScrollable` owns a `ScrollArea` and accepts
`contentClassName` for its inner content. Both use the same panel styling;
`PanelScrollable` makes the scroller itself the surface without an extra wrapper.
`AdaptivePanel` retains one React editor and scrollport while moving its stable
host between a docked column and the existing Drawer surface. Selection, unfinished
input and scroll state survive the change without adding history entries.
Drawer presence owns the modal content lifetime, including its closing transition.

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
- **Overlaps are insets inside the scroll.** `CanvasPage` reserves
  `--mobile-navigation-inset` inside its scroll, so the final content can move
  clear of navigation while earlier content passes underneath. Panels end above
  navigation and do not reserve that inset inside their own scrollers. Overlays
  remain outside the app shell and do not inherit its navigation inset. For a
  top overlay, `insetTop` reserves native scroll padding and shortens the track;
  the content supplies its own leading space.

Every flex ancestor between `h-dvh` and a scroller needs `min-h-0` (or
`min-w-0` across). Without it the item grows to its content, and the window
scrolls instead of the panel.

## Typography and spacing

Font loading and global font styles live in `src/6-shared/ui/theme/styles.css`;
font utilities and typography recipes live in `src/tailwind.css`. Compound
`--text-*` variables combine size, line height and weight into native Tailwind
utilities. Use these recipes rather than assembling typography at each call
site. Pair `text-overline` with `uppercase` when needed: the recipe does not
set text transform.

Apply margins and text color separately at the call site. Because compound
`text-*` recipes share the font-size namespace in `tailwind-merge`, competing
recipes passed through `cn()` resolve in favor of the last one.

Use the shared `--spacing` scale from `src/tailwind.css`. Prefer named utilities
and explicit `gap` on layout containers. Use arbitrary values only when the
component contract calls for a value outside the shared scale.

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
  kit `Toaster`, and `SnackbarNotice` own their complete visual state.
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
come back to, and `defineScreenInstances` for independent repeated openings.
Their descriptors share one ordered Screen map. Updating a saved view or
replacing a selected row does not add history. A surface that holds its own `useState` for openness is a Back
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

`ListDetailsSurface` presents one list/Details pair. When both panes fit, they
share one modal region and both remain interactive. On a narrow screen,
Details is the active drawer above its still-mounted list. The owner supplies
controllers and the `active` flag from Screen order; the surface does not
create history. Covered Drawer surfaces retain their content with `active={false}`,
without focus trapping, initial focus or direct outside/Escape dismissal.
Native Back still goes through the host from any originating drawer. Uncovering
a surface restores an active focus boundary. `AdaptivePanel` retains the same
Details subtree and scrollport across the presentation change.

Ordinary pair dismissal closes Details first, then the list. The list's explicit
close button closes both. Focus returns to the latest row or to the active
surface when the original opener no longer exists. Transaction lists save
query, search, checked identifiers and exact scroll position per instance.
The main Transactions page keeps its independent view and selected editor.

Android system Back can reach a Drawer through Base UI's `CloseWatcher` even
when a Select is above it. `DrawerFrame` routes that reason through
`useOverlayBack`: the host dismisses the top popup or screen and deduplicates
native callbacks within one event-loop task. A later Back request closes the
next owner even while the previous history step is pending; the existing
history queue serializes those steps. The originating
Drawer's own dismissal is canceled; its visibility still follows its owner.
Native close watchers are consumed even when that dismissal is canceled;
the remaining drawer must still respond to the next Android Back.
Android stories must require a live native watcher on
every Back request, without falling back to router history, and check that the
underlying page is hit-testable after the final close.
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
The surface owns close-control presentation, so forms do not need breakpoint
logic for it. Dialog exposes `closeButton` when a caller needs an explicit
choice. Popover accepts `anchor`, `side`, and `align`; its anchor controls position,
while the trigger controls focus restoration. It is modal.

Dialog and Drawer render their own dimming backdrops, including nested surfaces.
Anchored Popover keeps a transparent backdrop: it remains modal without dimming
the page. Its mobile Drawer presentation retains the Drawer backdrop.
Dialog, Drawer and modal Popover share `z-modal`; portal order places each child's
backdrop above the parent and below the child. Base UI's nested-backdrop
suppression is disabled for Dialog/Drawer. Popover and bottom Drawer retain a
screen-reader close control without an icon; Popover also needs that primitive
for Base UI's modal focus trap.

Kit surface presentation follows `useBottomSheetLayout`. Use the `mobile` prop
on Dialog, Popover or Menu, or `side` on Drawer, when a caller needs an explicit
presentation. Supported options and defaults live in those components.
On wider screens, right drawers use `--spacing-ui-drawer-inset` from
`src/6-shared/ui/kit/theme.css` and round every corner; on narrow screens they
fill the screen as a page. Bottom drawers remain flush with the viewport and
round only their top corners. Geometry lives in `src/6-shared/ui/kit/Drawer.tsx`.
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

`Dialog`, `Drawer` and their rendering-only Surfaces expose
`onOpenChangeComplete(open)` after the CSS transition finishes. Conditional
editors retain their form with `open={false}` until this callback reports
`false`, then release it so reopening starts a fresh draft.

An editor can hold a local draft and commit a changed valid value in `onClose`.
It owns validation and error handling. Never save from effect cleanup.
Save/Cancel forms save only on explicit submission. Pending operations must not
require their window to remain open. The component stories demonstrate close notification and explicit Save/Cancel
separately. The transaction editor uses kit fields, selection controls, menus
and an adaptive `DrawerSurface`; its existing popup or screen owns history.
The editor follows the shared bottom-sheet policy, using a right drawer on
wider screens. Its date and time inputs retain native segmented editing.
Existing transactions apply completed field edits automatically, one command
per finished action. Amounts finish on Enter or field exit; comments finish on
field exit. Date/time typing stays in the draft until field exit, while calendar
choices apply immediately. Nonpositive amounts shake and revert without a
command. A debt without a counterparty stays a draft until one is selected;
closing discards that invalid draft. Stable screen owners finish valid active
input on close or selection change. New transactions retain explicit creation.
Other application editors may still use legacy surfaces.

`Confirm` is passed to `useAsk<boolean>()`. Explicit confirmation answers `true`;
all dismissals answer `undefined`. `intent="danger"` uses AlertDialog semantics,
a destructive action and initial focus on Cancel. Ordinary confirmation initially
focuses the confirming action.

Copying budgets, filling goals, deleting selected transactions and restoring a
server history point apply immediately and call the kit's `toast.add` API.
The application mounts one `Toaster` for the shared `toast` manager, which owns
notification presentation and stacking. Successful operations use `success`,
failures use `error`, and no-change results and build information use `info`.
Storybook examples mount their own `Toaster` with an isolated manager, except
for the explicit global-manager example. Toast stories cover smooth dismissal
and downward swipe dismissal.
Persistent data and recovery warnings remain declarative `SnackbarNotice`
components rather than transient notifications.
Undo remains available through history controls and keyboard shortcuts.
Data reload starts directly; the journal recovery notice explains its effect
before the reload button.

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

`AnimatedItem` wraps keyed items inside Motion's `AnimatePresence`.
It owns entrance, exit and neighbouring-position animations;
exiting items become inert immediately. Keep item keys stable during editing.
`TextFade` clips one line with a trailing mask only when its text overflows.
Use it for constrained text throughout the interface. `render={<h2 />}` preserves
semantic elements, and `ref` points to the rendered element.
Place icons and actions outside it. `Chip` always applies that rule
to its label while retaining the complete accessible name.

Select panels opened from compact custom triggers size to their options, with
`popupMinWidth` setting their minimum. See the kit Select components for
defaults. Editing a chip's summary therefore does not resize its open list.
Ordinary Select field surfaces
still establish the panel's minimum width.

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

`ListPanel` keeps its native scroller with the scrollbar hidden. The list
primitive owns scroll-to-selected and keyboard navigation; a ScrollArea
viewport rendered as that element would replace its listbox role.

The transaction list uses TanStack Virtual with the kit ScrollArea viewport
passed through `viewportRef`. Dates and individual operations are virtual rows
with stable keys and fixed heights. Row dimensions and the date-switch offset
live in `src/3-widgets/transaction/TransactionList/GroupedList.tsx`.
Filters precede the list in DOM order. Their unscaled border-box height supplies
the virtualizer's top padding and scroll alignment, and ScrollArea's `insetTop`
keeps native focus scrolling and the thumb clear of the overlay. The filter
surface fades into the list; its visual settings live in
`src/6-shared/ui/kit/HeaderSurface.css`.
Below it, a separate date chip floats over the list without a full-width
background. The local `PinnedDateChip` owns its appearance and aligns with
ordinary date text. Its motion settings live in `GroupedList.css` beside the
component. Pinning fades only the shell, keeping the date text continuously
visible. Label changes use directional motion, reduced to opacity when reduced
motion is requested. The chip switches dates before the next header reaches
the filter edge, without pushing against it. The active source heading is
hidden while its chip is pinned, preserving its row height. A focused source
date hands focus to the chip without scrolling; returning to the top hands it
back. Restoration and calendar navigation retain the date-based contract,
including when empty search results become nonempty again.

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
introduced or changed. Check responsive behavior immediately below and at its
boundary, taking the current threshold from the owning breakpoint or layout
hook.

Useful checks:

```sh
pnpm verify
pnpm test:storybook src/6-shared/ui/kit/InlineField.stories.tsx
```

Run only task-relevant stories in both themes with the configured worker
limit. Include direct consumers of a changed shared component. Full browser
runs (`verify:ui`, `verify:all`, or unfiltered `test:storybook`) are reserved for
an explicit user request or genuinely global UI changes. Explain the global
impact before starting one. See `docs/agents/verification.md` for the routing
matrix; CI configuration is unchanged.

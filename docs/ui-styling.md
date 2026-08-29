# UI styling compatibility

The application uses Tailwind utilities alongside MUI components and Emotion.
The shared `Providers` component is used by both the application and Storybook.

## Cascade

`StyledEngineProvider` enables `@layer mui`. The layer order is declared both
before Emotion's rules and in the Tailwind entry point:

```css
@layer theme, base, mui, components, utilities;
```

`injectFirst` alone is insufficient: unlayered MUI declarations override layered
Tailwind utilities regardless of stylesheet insertion order. Components and
portals use the same provider so utilities override MUI defaults without
`!important`. Tailwind Preflight remains disabled; MUI `CssBaseline` supplies
the reset.

Every co-located component stylesheet wraps its rules in `@layer components`.
An unlayered rule outranks the whole `mui` layer, and a stylesheet that is the
first to declare a layer name registers that layer's position, so unlayered or
ad-hoc-layer CSS makes the order depend on module load order.

`components` is an earlier layer than `utilities`, so a rule in a co-located
stylesheet cannot outrank a Tailwind utility however specific it is. Whenever a
property's precedence is decided in CSS, that property has to leave the class
list entirely — `OutlinedField` owns the `border` shorthand in its stylesheet
precisely because a `border` utility on the same element would pin the width
back to 1px.

Reach for a stylesheet when the _order_ of state rules matters. Tailwind, not
the class string, decides when each variant is emitted, and it emits
`focus-within` before `hover` — so `group-hover:` and `group-focus-within:`
rules at equal specificity resolve hover-last, and a hovered field silently
loses its focus ring. `src/6-shared/ui/OutlinedField.test.ts` pins that order.

Order only decides while the weights stay level, so a rule set written this way
has to keep every selector at one specificity. `:has()` is the trap: it takes
the weight of its most specific argument, so `:has(input:focus)` is a whole
element heavier than `:hover` and starts outranking the rules under it.
`:where()` costs nothing, which is why the focus rule reads
`:has(:where(input):focus)` — the argument then contributes only its
pseudo-class. The same test computes all four weights rather than trusting the
selectors to look alike.

## Converting values

MUI's numeric spacing uses 8px units; Tailwind uses 4px units. Other numeric
properties are not spacing and must be checked individually.

| Existing MUI value        | Equivalent utility                          |
| ------------------------- | ------------------------------------------- |
| `p: 2`                    | `p-4` (16px)                                |
| `spacing={0.5}`           | `gap-1` (4px)                               |
| `height: 2`               | `h-[2px]`                                   |
| `borderRadius: 1`         | `rounded-lg` (theme radius, 8px)            |
| `borderRadius: 2`         | `rounded-2xl` (twice the theme radius)      |
| `color: 'secondary.main'` | `text-interactive`                          |
| `bgcolor: 'action.focus'` | `bg-action-focus`                           |
| `boxShadow: 2` / `4`      | `shadow-elevation-2` / `shadow-elevation-4` |
| `zIndex: modal`           | `z-modal`                                   |

Colors, radii, elevation shadows, and the modal stacking level are derived from
the active MUI theme. Every value `AppThemeProvider` emits gets a Tailwind
counterpart in `src/tailwind.css` — a `--color-*` alias, a `--shadow-*` alias,
or an `@utility` — in the same change that adds it. A theme variable with no
counterpart forces `[box-shadow:var(--elevation-8)]` at the call site and
quietly reintroduces arbitrary values. Elevations 1, 2, 4, 8, 10 and 16 are
registered as `@utility` blocks; they are deliberately not also `@theme`
entries, because Tailwind would emit both rules and only the later one would
ever apply. `--input` is MUI's outlined field border — 23% of the colour that
sits on the background, built the way `OutlinedInput` builds it rather than
pasted as a literal, and heavier than the `--border` divider. `--action-active`
is the icon colour and `--action-disabled` is the one MUI greys a disabled
field's border with, which is a different token from the `--disabled-foreground`
it greys the text with.

The rule runs the other way too: a value the theme already names does not get
rewritten as a literal in a class list. MUI's state fills are
`palette.action.hoverOpacity`, `focusOpacity` and `selectedOpacity` over a
colour, and `createTheme` pins `hoverOpacity` itself, so writing
`hover:bg-primary/4` would fork that number where no change to the theme could
reach it. `--primary-hover`, `--primary-focus`, `--primary-selected` and
`--primary-selected-hover` are composed in `AppThemeProvider` the way `--input`
is; the last is the sum of the selected and hover opacities, which is how MUI
stacks them. `--disabled-opacity` is `action.disabledOpacity` and is an
`@utility` (`opacity-disabled`) rather than a `--color-*` alias, because MUI
dims a disabled menu item instead of recolouring it.
`secondary` is the semantic selected-surface token, not MUI's secondary brand
color. MUI palette paths such as `text.disabled` are not CSS color values:
use a resolved color, a semantic utility, or keep dynamic palette lookup in
`sx`. MUI's `color` prop supports names such as `textDisabled`, not arbitrary
palette paths in the installed version: `<Typography color="text.disabled">`
renders no colour at all. `sx={{ color: 'text.disabled' }}` does work, because
`sx` is the system. A converted element that turns such a prop into a real token
class makes text change colour that never changed before, so check what the
element actually rendered before carrying the intent across.

Two of those were revived deliberately rather than reproduced: `Total` mutes a
zero amount and colours its error and success states, and the envelope goal
placeholder is muted until a goal exists. `Total.stories.tsx` pins those four
amount colours in both themes. `Total` names the states, `amountColor="error"`,
instead of taking the palette path its props used to carry.

MUI `Stack spacing` is a margin rule on the children, `& > * + * { margin-top }`,
and it outranks a child's own `sx` margin. A flex `gap` adds to that margin
instead of replacing it, so a child that carried `mt` beside a `spacing` Stack
ends up further down than it was. Check what the child actually rendered at
before keeping its margin. A Stack written with `sx={{ gap }}` already used real
CSS gap and converts one to one.

Tailwind owns short class names that a stylesheet may already use: `container`
and `shadow` are utilities. An unlayered rule still wins for the properties it
declares, but the utility keeps contributing the ones it does not, so
`.container` silently gained breakpoint max-widths and a decorative `.shadow`
gained a real box-shadow. Prefix class names that are shared with a stylesheet.

Use `cn()` when caller classes override a component's default utility classes.
`clsx()` only concatenates classes: the last class in an HTML attribute does not
necessarily win. Budget group rows, for example, override `items-center` with
`items-baseline`. Grid `justify-start` is not equivalent to `justifyContent:
'initial'`: it prevents an `auto` track from stretching.

## Breakpoints

`src/6-shared/ui/theme/breakpoints.ts` is the single source. The MUI theme is
built from that map, so `theme.breakpoints.down(...)` and the MUI-free
`useBreakpointDown(...)` hook switch on the same pixel, including MUI's 0.05px
subtraction. Every component switches through that hook; MUI's `useMediaQuery`
is gone from the app. The queries that are not breakpoints at all — colour
scheme, the iPhone home bar — go through `useMediaQueryValue`, which is the
store the breakpoint hook is built on. `src/tailwind.css` mirrors the same numbers because Tailwind cannot read
TypeScript; that mirror is the one place a value has to be changed twice. It is
written in pixels, not Tailwind's usual `rem`, so the mirror cannot drift from
the pixel queries MUI and `useBreakpointDown` run whenever the root font size
is not 16px. `breakpoints.test.ts` reads `tailwind.css` and checks both halves,
because nothing else notices when only one of them moves — the app keeps
compiling and `md:` simply starts switching at a different pixel than
`useBreakpointDown('md')`. The same test rejects any breakpoint Tailwind
registers that this map does not define, which is what `--breakpoint-2xl:
initial` is there to clear. Do not write a media query string in a component.

## Typography recipes

`src/tailwind.css` registers `type-body`, `type-body-sm`, `type-caption`,
`type-overline`, `type-title`, `type-title-lg`, and `type-display` as top-level
Tailwind v4 `@utility` rules. Tailwind emits them in the `utilities` layer and
supports variants such as `md:type-title` (the compatibility `md` breakpoint is
900px).
Stylelint explicitly allows `utility`; unknown at-rule checking remains enabled.

Use one base recipe per element, with an optional recipe at another breakpoint:

```tsx
<h2 className="m-0 truncate type-title">{title}</h2>
<p className="m-0 type-body md:type-title text-muted-foreground">{summary}</p>
```

Recipes do not choose HTML semantics, margins, alignment, truncation, or colors.
Choose those at the call site. Local utilities such as
`type-title font-normal leading-6` can override the corresponding recipe values.

Preflight is disabled, so a native `p` or `h1`-`h6` keeps its user agent
margins, which scale with font size. MUI `Typography` sets `margin: 0`, so every
element converted away from it needs an explicit reset: `m-0` when the source
had no margin, or `mt-0` beside the margin utility it already carried. Only
`gutterBottom` produced a margin of its own, `0.35em` at the bottom.

`type-title-lg` is the 24px / 1.334 / 400 recipe matching the themed MUI `h5`
contract. `type-overline` intentionally has no letter-spacing: the active IBM
Plex Sans MUI theme does not add the Roboto-specific overline tracking.

MUI's typography variants carry letter-spacing only while the theme keeps
Roboto: `createTypography` drops it outright for any other family, and this
theme sets IBM Plex Sans. That is why `type-overline` has no tracking, and why
the owned `Button` has none either — reading MUI's source rather than the
rendered result would have added it to both.

Every recipe pins its font weight. MUI declares one on each typography variant,
and containers such as `Tooltip`, `ListSubheader`, and `Button` set weight 500
on their own, so a recipe that inherited weight would render differently
depending on where it sits.

`surface-card` is the shared static Paper surface recipe. Pair it with an
explicit `shadow-elevation-1`, `shadow-elevation-2`, `shadow-elevation-4`, or
`shadow-elevation-10` when the source surface has elevation. Padding, layout,
clipping, radius exceptions, and z-index remain local to the consumer. Do not
use it to replace Paper slots owned by Drawer, Popover, Menu, or Tooltip.

A `ButtonBase` (and therefore `Button`, `IconButton`, and every MUI control
built on it) renders a native `button`, which resets `font-family` to the user
agent default. MUI `Typography` set the family itself; a native element with a
`type-*` recipe does not, because the recipes carry size, line height, weight,
and case but not the family. Add `font-sans` when a converted element lives inside a
button. `Btn` in the budget row is the exception: its `sx` already sets the
family on the button itself.

`tailwind-merge` treats `font-size` as conflicting with `leading` — the
`text-sm/6` shorthand is why — so a later size class written on its own
silently deletes an earlier `leading-*` and the element loses its height.
Where both are set, put them in one `text-<size>/<leading>` utility so they
cannot be separated.

`cn()` uses the default `tailwind-merge` configuration, which does not know the
custom `type-*` group. Do not expect `cn('type-body', 'type-title')` to select
the last recipe; select one recipe explicitly. Class-string order alone is not
a CSS precedence rule.

## Regression checks

### Owned interactive components

`AdaptivePopover` is `Popover` at 900px and above and Base UI Drawer below
900px. It adds exactly one prop to `PopoverProps` — `drawerSide`, the edge the
mobile drawer slides in from, ignored on desktop — because above the
breakpoint it adds nothing at all: the desktop half is the owned `Popover`
rather than a second copy of it, so the two cannot drift apart in geometry,
entrance or focus handling. Each half is its own component, so switching
between them across the breakpoint cannot reorder anyone's hooks. The rest of
`PopoverProps` either carries across — `onOpenComplete` is the drawer's
`onOpenChangeComplete` — or names geometry against an anchor, which a sheet
off an edge has none of, and the drawer half spells those out so they cannot
reach a `div` that would not know what to do with them. History remains
controlled by `historyPopovers`; the component does not push or pop history
itself. Desktop positioning starts at the anchor's top-left with a
16px collision margin. Mobile placement defaults to bottom; budget assignment
uses top. Both variants render an `sr-only` Close part, which also enables
Base UI's modal focus trap. The CSS contains placement/swipe transitions and a
reduced-motion override.

Its desktop surface therefore carries `data-slot="popover"` while the drawer
carries `data-slot="adaptive-popup"`; stories that assert on the surface match
either.

Every owned overlay now portals to the document body. `muiFocusBoundary.ts`
is gone: while MUI still owned a modal, a Base UI surface opened from inside
one had to be portalled into that modal's paper, or MUI's focus trap pulled
focus straight back out of it. That was the file's stated exit condition —
the last MUI overlay converted — and it has been met. Two Base UI surfaces
need no such bridge: they layer themselves, whether or not one sits inside
the other's DOM or even its React tree. `useOverlayFocus` is down to the one
job its name claims, and the `container` it used to feed is gone from
`Dialog`, `SmartDialog`, `Menu`, `Popover`, `AdaptivePopover` and
`SideDrawer`.

The nested-surface stories are what hold that down, and they were rewritten
to assert the behaviour rather than the DOM: focus stays inside the child,
Escape takes the top surface only, and the parent gets its trigger back.
Containment was the old mechanism, not the requirement.

`SideDrawer` is MUI's temporary `Drawer`: a full-height sheet off a side edge
over a dimmed page, square-cornered, because MUI reserved rounding for
`SwipeableDrawer` — which this app only used off the bottom edge, where
`SmartDialog` still is. Base UI's swipe cannot be turned off, only aimed, so
it is aimed at `side`: the gesture undoes the entrance. The default would be
`down`, which on a full-height scrolling sheet is the same gesture as reading
further, and would drag the sheet off an edge it never came from. Width
belongs to the caller through
`className`, the way MUI took it through `sx` or `slotProps.paper`; the height
is always the window. Six surfaces use it: both page side panels, the three
global transaction sheets and the history panel. It reuses the same
`owned-drawer` CSS as the other two drawers, with `--drawer-radius: 0`. Its
stories compare the paper against MUI's in both themes and at both widths —
edge, size, background, corners, flex direction and scroll axis — and cover
the focus trap, the scroll lock and backdrop dismissal.

`NavDrawer` is MUI's docked `Drawer`, which is two boxes rather than one: a
root that reserves the panel's width in the page flow, and the panel itself,
fixed and scrolling on its own. It is never dismissed — below 900px the layout
swaps in `MobileNavigation` — so it has no open state, no backdrop and no
focus trap, and `SideDrawer` would have been the wrong replacement. It keeps
MUI's right border, its `zIndex.drawer` level (now a `--z-drawer` token beside
`--z-modal`) and its hidden scrollbar, and `Navigation/index.tsx` no longer
passes width through `sx` because the panel owns it.

Its links are a real `ul` of `Link`s, which is what `ListItemButton
component={Link}` rendered anyway, and the open section carries `aria-current`
rather than only a selected colour.

`listRowClass` is a **menu** row: tighter padding, and a label whose margin is
zeroed because `MenuItem` zeroes it. `listItemClass` is MUI's `ListItemButton`
— 8px around a label that keeps its own 4px, 48px against the menu row's 36px
— and `listItemDenseClass` is its `dense` variant, which halves the padding
and drops the label to `body2`. All three share one base, so a state added to
a row is added to every row. They are separate classes rather than one with
overrides because every call site that reached for the menu row and then added
`py-2` was rederiving the list row by hand.

`ListRowText` declares no type of its own; it inherits the row's, which is how
one label is `body1` in a regular row and `body2` in a dense one, as MUI's
`dense` context made it. Its secondary line declares no wrapping of its own
either, so a truncating row truncates it and a `whitespace-normal` one lets
it wrap — MUI spelled that out per call site through `slotProps`.

A row that acts is now a real `button`, where MUI's `ListItemButton` was a
`div` with `role="button"`. Two things follow. A row that carried a second
control — the history run's expand chevron — has it as a sibling rather than
a child, because a button may not contain one, and the row is padded to leave
it room. And a row now paints its own `text-foreground`, where `ButtonBase`
inherited: a list that tints its rows from above, like the envelope info
panel, asks for `text-inherit` back. `ListRows` is MUI's `List`, and a `div` rather than a
`ul`: MUI's was a `ul` whose children were `div role="button"` rows and
subheaders, a list no assistive technology could read. Where the semantics are
real — the navigation links, the tag options — the call site builds its own
`ul` of `li`s. `ListRowSubheader` takes `sticky` as an opt-in rather than
MUI's opt-out, and has no `dense`, because MUI's subheader does not take
`dense` from the list around it and no call site here ever passed it.

Every box was measured into place rather than reasoned into place, and the
parity stories caught three things reasoning had wrong: the naive nav row came
out 12px short, `ListRowText`'s hardcoded type made dense labels 4px too tall,
and MUI's 4px label margin turned out to sit on `ListItemText`'s root rather
than on the `primary` span inside it. `UI/List rows` compares the container,
the subheader, the row and the label against MUI in both densities and both
themes; the row comparison leaves out the row's own declared font, because
MUI's `dense` is a context that reaches the label and leaves `body1` declared
on a row that never paints with it. `ListRowText` carries a `data-slot` so
these stories can find the label without matching on its text.

`Collapse` is MUI's, on Base UI's `Collapsible`: height from nothing to what
the content needs, over the theme's standard 300ms, with the content unmounted
while closed. It is driven rather than triggered — Base UI pairs a panel with
the button that opens it, and not one of these panels is opened by a button
beside it — so the root is controlled and `Collapsible.Trigger` left out. The
root is `display: contents`, because MUI animated a single box and Base UI's
root exists only to carry state; a closed collapse leaves that empty box in
the DOM, which lays nothing out.

Two things about it were measured rather than assumed. Base UI keeps
`--collapsible-panel-height` current, so a panel whose content grows while it
is open follows the content instead of clipping it — which is what MUI's
`height: auto` at rest bought, and there is a story that says so. And MUI stops
clipping once it arrives, so the panel's `overflow` flips to `visible` through
a discrete transition delayed by the height's own duration, declared on the
open state so that only opening waits and closing clips from the first frame.
That delay is why the story polls for the rest state instead of asserting it
once: a discrete transition is not something `getAnimations` reports on.

`Button.tsx`, `OutlinedField.tsx`, and `ActionList.tsx` in `6-shared/ui` are
owned Base UI compositions styled for the existing theme. These are
deliberately narrow contracts, not copies of the MUI prop surface.

`Button.tsx` carries `Button`, `IconButton` and `ButtonBase`, and MUI's names
for what they take: `variant`, `color`, `size`, `fullWidth`, `startIcon`,
`edge`. What it does _not_ carry is every combination MUI offers.
`buttonPalettes` lists the variant and colour pairs this app renders — text in
primary, secondary and inherit; contained in primary; outlined in primary and
error — and that table is the contract. Each pair needs tokens, a disabled
state and a dark shade of its own, so an unused one is not free. A pair no
entry covers falls back to the variant's primary rather than rendering
unstyled, and `Button.stories.tsx` builds its parity matrix by walking the
table, so a pair added there is compared against MUI without anyone
remembering to list it. `variant` and `color` stay separate props rather than a
discriminated union of the pairs, because a call site that picks its variant
with a ternary hands over `'contained' | 'outlined'` in one prop and TypeScript
will not distribute that across union members.

Two things the owned Button does differently on purpose. It shows a real focus
ring: MUI leaves `.Mui-focusVisible` unstyled and lets the ripple stand in for
it, and there is no ripple here. And it does not resize a `startIcon`. MUI
shrinks one to 20px through `& > *:nth-of-type(1)`, but that rule sits in the
`mui` layer while every icon in this app carries a Tailwind size utility from
the later `utilities` layer — so MUI has never actually resized one of these
glyphs, and matching what the app renders means leaving the icon alone.

`RESET` declares neither `padding` nor `border-width`: each of the three
components adds exactly one of each. A reset that set them would leave two
classes contending for one property with only Tailwind's emission order to
separate them, which is not a precedence rule.

`ListRow.tsx` holds the row vocabulary MUI spread across `MenuItem`,
`ListItemIcon`, `ListItemText`, `ListItemSecondaryAction`, `ListSubheader` and
`Divider`: `listRowClass` plus `ListRowIcon`, `ListRowText`, `ListRowAction`,
`ListRowSubheader` and `ListRowDivider`. Two containers use it and their
semantics differ, so it belongs to neither of them rather than being borrowed
from whichever defined it first. It is not published as a generic
`ListItemIcon` or `Divider`, because it carries these two lists' geometry and
nothing else needs it. `ListRowText` has no margin of its own: MUI's
`ListItemText` does, but `MenuItem` zeroes it, and a row that keeps it is 8px
taller than the one it replaced.

`listRowClass` spells the disabled state twice, once as `disabled:` and once as
`aria-disabled:`. A toolbar row is a real `button` and carries `disabled`; a
menu row is a `div` with `aria-disabled`, because a menu keeps its disabled
items focusable so they are still announced. Only one variant ever matches, and
without both a disabled menu row is not dimmed at all.
`ActionList.stories.tsx` compares rows, icon slots, subheaders and dividers
against the MUI originals.

`Menu.tsx` is MUI's `Menu`: a popup with menu semantics, positioned against an
element (`anchorEl`) or a point (`anchorPosition`, for a context menu opened by
a right click or a long press). `placement` has two values, which are the two
the app uses: MUI's default, the menu's top-left over the anchor's, and
`top-end` for the transaction action bar, which sits at the bottom of the
screen and opens upward. `onCloseComplete` is there for the filter bar, which
opens a clause editor the moment the menu is gone — starting it while the menu
is still animating out moves focus twice. That menu also passes
`transition-none`, which reaches the shared entrance's rule because
`utilities` is the later layer.

`MenuItem` turns Base UI's `closeOnClick` off. These menus live on the history
stack, so closing has to go through the popover's own `onClose` and pop the
entry exactly once; letting Base UI close the menu as well would pop it twice
and send the user back a page. Every call site already closed explicitly.

`popupSurface.ts` holds what the anchored popups share. `popupSurfaceClass` is
the paper MUI drops out of a control — the menu and the select's list are the
same one, down to the elevation and the 8px the rows sit in — described once
the way `listRowClass` describes their rows. `popupPositioning` is the rest of
what they hand the positioner, including the zeroed `arrowPadding`: there is no
arrow, and the default 5px of room for one shifts a menu opened at a point off
that point. `overAnchor` is the offset that lays a surface's top-left over the
anchor's own, which is where MUI puts it and where Base UI does not.

`growSurfaceClass` is the entrance all three anchored surfaces share, and the
only reason the mechanism is CSS rather than utilities is that it needs
`data-starting-style` and `data-ending-style`. They grew apart in how far, how
long and from where, so those are `--grow-from`, `--grow-duration` and
`--grow-origin`, set beside the class by whichever surface differs: the select
grows less than a menu because it opens over its own field, and the adaptive
popover is slower and grows out of the corner it is anchored to rather than
wherever collision handling left it, since that one only ever shifts. A call
site's `transition-none` still beats all of it, `utilities` being the later
layer, which is how the filter bar chains a second surface off the menu
without waiting.

`drawerSurfaceClass` and `drawerBackdropClass` are the other pair in that
module: a surface that slides in off an edge and can be swiped back out, and
the dim behind it, which lifts as the drawer is dragged away. Two surfaces use
them — the adaptive popover on a phone and `SmartDialog` on one — and they
differ only in how round the leading corners are, so `--drawer-radius` is a
variable and `data-placement` decides which corners it lands on.
`AdaptivePopover.css` is gone: everything in it was one of these.

`Dialog.tsx` is MUI's `Dialog`: a paper centred over a dimmed page, at most
600px wide and never taller than the window less its 32px margins. Base UI
supplies the modal behaviour and `Dialog.Viewport` is the flex box that centres
the paper, which is MUI's `container` under another name. The paper sits at
elevation 24, which is the level this change had to register — `--elevation-24`
in `AppThemeProvider` and `shadow-elevation-24` in `src/tailwind.css`, the way
every theme value gets its counterpart. Nothing grows or slides: MUI fades a
dialog and its backdrop in together and out slightly faster, and a dialog is
not anchored to anything to grow out of.

`DialogTitle` and `DialogContentText` are Base UI's `Title` and `Description`,
which is what labels and describes the dialog for assistive technology rather
than a heading and a paragraph styled to look the part. `DialogContent` drops
its top padding when a title sits above it, which MUI does with a sibling rule
and so does this. `DialogActions` uses a flex `gap` where MUI puts a
`margin-left` on every child after the first — the same 8px, and it is why the
parity story compares plain buttons: a `Button` of ours resets that margin from
the later layer.

`useOverlayFocus` captures the focused element when the dialog opens, before
the popup commits and autofocus moves focus. Its state initializer also covers
a form that mounts already open with a fresh `instanceKey`. The target stays
fixed through that opening and its exit; closing returns focus to it if it is
still connected. A later opening captures its own target. Every owned overlay
uses it — `Dialog`, `SmartDialog`, `Popover` and the adaptive drawer — so a
surface never returns focus to an anchor that was merely the wrapper around
the control someone actually pressed. It takes the open flag and nothing
else: it once also took an anchor, to pick a portal container, and that job
left with `muiFocusBoundary.ts`.

A confirmation rendered in `GlobalWidgets` — outside its parent's React tree
— still behaves: Escape closes the child and returns focus to the parent
action without closing the parent drawer. That used to need the portal
bridge, because MUI's focus trap had to contain the child. Two Base UI
surfaces layer themselves instead.

`SmartDialog` is that dialog on a desktop and a drawer off the bottom edge on a
phone, which is how MUI's `Dialog` and `SwipeableDrawer` were paired here
before. History decides whether it is open, so Back closes it; unlike a
select's generated key, this one is written down, because `registerPopover`
hands the same one to whatever opens the dialog. The envelope edit dialog used
to get a fresh form by passing a React `key` through `displayProps`, which React
19 warns about and the owned `DialogProps` has no room for; it uses the
`instanceKey` that `registerPopover` already hands out for exactly this.

`Popover.tsx` is an anchored modal at every viewport size. It retains MUI's
top-left-over-anchor placement, 16px viewport margins, rounded paper and
elevation 8. Collision handling shifts the surface into view rather than
flipping it. On its own it never becomes a drawer; `AdaptivePopover` is what
adds that below 900px.

`placement` and `align` are MUI's `anchorOrigin` in the only two settings the
app ever gave it: the default, which lays the paper's top edge over the
anchor's own, and the filter editor's and tag list's `bottom`, which drops it
clear. `align` is the horizontal half of the same pair, and it also decides
`--grow-origin`, since a surface grows out of the corner it hangs from — which
is why that variable is set here rather than in the shared surface class.
`onOpenComplete` is MUI's `slots.transition.onEntered`: the filter editor's
combobox measures its popup against the surface, so its options wait
until the surface has stopped scaling.

The paper itself is `anchoredSurfaceClass` in `popupSurface.ts`, next to the
menu's `popupSurfaceClass`, because two components hang a surface off an
anchor and it is described once for both. It carries MUI's own 16px minimum
width and height, and MUI's clipped horizontal axis: an anchored paper only
ever grows downwards, so sideways overflow is a layout mistake rather than
something to scroll.

Its `anchorEl` controls geometry, not focus. The month header anchors to a
wrapper around several buttons while focus returns to the arrow or label
actually pressed inside it; `useOverlayFocus` captures that control separately.
The retained anchor keeps exit geometry stable even when a caller clears
`anchorEl` on close.

`GoalPopover` renders `MonthSelectPopover` inside its React subtree so Base UI
recognizes the nested modal. The calendar anchors to the date button it drops
out of, not to whatever opened the goal: under MUI it hung off the goal's own
anchor, which put a now-modal surface squarely over the form it belongs to.
Escape dismisses the calendar first and returns focus to the date button;
dismissing the goal returns focus to its opener. The registered goal keeps its
existing history entry and `instanceKey` draft reset. The calendar still uses
local open state; Back closes the registered goal and its nested calendar.
Form conversion and goal commands are unchanged.

The month grid uses native buttons with selected and disabled states. Its
spacing includes the old `ListItemText` margins: substituting menu rows would
make the calendar shorter. Year controls have localized accessible names, and
the existing `minMonth`, `maxMonth` and `disablePast` rules still apply. The
displayed year is scoped to one opening, the way the focus target is: paging
to another year and dismissing without choosing does not carry that year into
the next opening.

Popover stories compare light/dark surface geometry, viewport-edge placement
and the below-the-anchor centred variant against MUI. Month stories compare
cell geometry and exercise date bounds. Dialog stories cover nested
selects/calendars inside the owned `SideDrawer`, focus restoration, draft
reset, and saving/removing a dated goal.

MUI's `Drawer` is gone from the app, modal and docked alike, and with it the
last `.MuiDrawer-paper`. So are its list primitives — `List`, `ListItem`,
`ListItemButton`, `ListItemText`, `ListItemIcon` and `ListSubheader` — across
the account list, the debtor list, the history rows, the envelope info panel,
the grouped transaction list, the navigation links, the tag options and the
account-history widget.

`Checkbox`, `InputBase`, `CircularProgress` and `Switch` round out the
controls. The checkbox's glyph is drawn in the component rather than imported:
it is the control's own artwork — two Material shapes where the ticked one is
a filled box with the tick cut out of it, not the empty one with a tick laid
over — and nothing else asks for it. `CheckboxField` is MUI's
`FormControlLabel`, which only ever held a checkbox here, so the two are one
component and `control={<Checkbox />}` goes away with it.

`Switch` is drawn but not wired. The only one in the app is decorative: the
settings row carries the click and `aria-pressed`, and the switch used to be
an inert MUI input inside it. It is a span now, so there is nothing to make
inert.

`InputBase` is a field with none of `OutlinedField`'s decoration, for the two
places that draw their own surface around it. Its input takes `font: inherit`
rather than a family and a size, because a bare input starts from the
browser's 13.33px and every measurement under it — the `1.4375em` height most
of all — is a multiple of what it inherits. The root's line height is that
same `1.4375`, not `type-body`'s 24px, which is what the field's 32px comes
from. Its multiline form shares `GrowingTextarea` with `OutlinedField`, so a
comment follows controlled content instead of becoming a one-line scrollport.

`CircularProgress` is two animations at once: the svg turns at a constant rate
while the arc it draws grows and shrinks. One would either stutter or never
close the loop. There is no determinate variant, because nothing in this app
knows how far along it is.

Four more scheme-dependent values joined the theme with them — the switch's
thumb, track and track opacity, which MUI builds out of the scheme's extremes
rather than out of the palette. And two notations that the parity stories
caught twice over: `rounded-full` computes to 9999px where MUI writes `50%`,
and Tailwind's opacity modifier mixes in `oklab` where MUI writes `rgba`.

`Tooltip`, `Chip` and `Link` are owned now as well. `Tooltip.tsx` had wrapped
MUI's only to make the label 14px instead of 11px, which is now simply what
the class says; the wrapper stays because every call site already imports it,
so converting one file converted thirteen. Three things about it are MUI's
rather than Base UI's: the default side is `bottom`, touch holds for 700ms and
stays open for 1500ms after release, and a string title becomes the child's
`aria-label`. That last one is not decoration — Base UI
_describes_ a trigger, and describing an unnamed icon button leaves it
unnamed, which is what the settings-menu story caught the moment the wrapper
changed. MUI named the child, so this does too.

`Chip` is a `div` even when it has an `onClick`, because that is what MUI
rendered and because a deletable chip would otherwise be a button inside a
button. The root remains the single keyboard target; Enter/Space click it and
Delete/Backspace remove a deletable chip. Its story
measures all eight shapes the app asks for — filled and outlined, medium and
small, primary, deletable — root and label, in both themes. Three of its
numbers came out of that measurement rather than out of the MUI source: the
radius and the root's type do not change with the size (MUI puts the smaller
type on the label), and an outlined chip's delete cross keeps the filled one's
margins.

`Link`'s underline is a fainter shade of the link itself, but only when the
underline is always there; one that appears on hover is drawn in the text's
own colour, because at rest there is nothing to distinguish it from. The one
control that is a button doing a link's job takes `linkClass` and brings its
own button reset, which is what MUI's `component="button"` did.

Those three added six tokens, all of them composed opacities that belong in
`AppThemeProvider` rather than as `/70` at a call site: the tooltip's fill and
type, the chip's hover, border, primary border and the two states of its
delete cross, and the link's underline. Writing them as Tailwind opacity
modifiers would have been visually right and textually different — Tailwind
mixes in `oklab` where MUI writes `rgba` — which is how the parity stories
found them.

MUI's `Collapse` is gone too — it was the only transition of MUI's this app
ever used, at six call sites, every one of them `in` plus `unmountOnExit` and
nothing else. The date pickers are gone too: transaction editing uses the
native date control, and the grouped list opens that same bounded control in
its existing `SmartDialog`. The native control is the smallest fit for both
single-date interactions; no calendar overlay needs to be owned.

MUI's `Popover` is gone from the app. Its last four callers were the floating
rename field, the colour picker, the tag list and the transaction filter's
clause editor. The filter's three multiple-value inputs are now the owned
`MultiCombobox`: its input only narrows a fixed list, while the selected values
remain chips that can be removed with the keyboard. That is a combobox rather
than an autocomplete because typed text is never itself a filter value. The
tag list's rows went with its surface, from `ListItemButton` to `ButtonBase` on
`listItemClass`, so its keyboard tests moved off MUI's `Mui-selected` class and
onto the `data-selected` attribute every owned row carries — the same
highlight, named by the app rather than by MUI.

`OutlinedField` is MUI's outlined text field: the notched border with the label
cut into it. `Field.Root` from Base UI supplies the label and description
wiring and the `data-invalid` / `data-disabled` state the stylesheet keys off,
so none of that is spelled out by hand. Native props target the input, while
`className` lands on `Field.Root` and sizes the whole field, label and helper
text included. Use `startAdornment` and `endAdornment` rather than MUI
`slotProps`, and reach the input itself through the frame — the time field
hides a native picker button with `[&_input::-webkit-calendar-picker-indicator]`.

The label rests inside the field and floats into the notch once the field is
focused or filled, which is what MUI calls shrinking. `Field.Root` already
reports both of those as `data-focused` and `data-filled`, so the two positions
are a pair of stylesheet rules rather than React state, and the notch's legend
opens and closes off the same two attributes. A select's trigger is not a
`Field.Control` and nothing reports it filled, so `Select` passes `shrink`
itself. This is why the frame takes `size` after all: the resting label sits on
the control's own padding, and MUI rests it 7px lower on a medium field than on
a small one.

`multiline` renders a textarea that grows with what is typed into it, up to
`maxRows` lines. MUI grows one by measuring a hidden copy of the textarea on
every keystroke; this one puts a mirror of the text in the same grid cell and
lets the cell size itself, so there is no layout effect and nothing to re-run
when the value is changed from outside. The cap is `maxRows` in `lh` units —
the line box the field already sets, so it cannot drift from the text it counts
— and it goes on the textarea and the mirror rather than on the padded sizer,
which would otherwise scroll its own padding and show a sliver of the next line
under the border. The mirror reads the controlled value; an uncontrolled
multiline field would stay at one row, and there is none.

`OutlinedField.stories.tsx` pins both modes against MUI: where the label sits
and how far the notch is open, empty and filled, in both sizes and both themes;
and the height of a multiline field at one, three and more rows than it may
grow to.

The focus ring keys off the control, not `:focus-within`. The group holds the
adornments, and both real callers put an icon button in one — the submit arrow
in assignment and in money moving — so `:focus-within` would light the field up
while `AmountInput` had already swapped the expression back for the formatted
value. MUI paints the ring from the input's own focus handler and leaves the
resting border when focus reaches an adornment; so does this. `AmountInput` owns the input's
`ref` and `type` — the ref drives `selectOnFocus` and the sign buttons, and
`tel` raises the numeric keypad — so both are removed from its prop type and
applied after the caller's spread.

`ActionList` is a persistent list of actions inside an existing overlay, with
toolbar semantics rather than menu semantics: the list is always on screen and
nothing opened it, so `role="menu"` would promise a dismissable popup that is
not there. Base UI's Toolbar gives roving focus, the arrows and disabled-item
handling; `useRovingListKeys` adds the Home/End and typeahead its composite
root does not forward. It does not open a second popup or take initial focus
from the amount field. It is the replacement for MUI `MenuList`/`MenuItem` in
owned overlays, and `SettingsMenu` now runs on it.

That change is visible to assistive technology and to tests: the rows are
toolbar buttons, not `menuitem`s, so `SettingsMenu.stories.tsx` looks for a
`toolbar` and the buttons inside it. The rows that navigate render an anchor
through `render={<Link />}` and must pass `nativeButton={false}`, or Base UI
assumes a native `button` and drops the link semantics. The auto-sync and
budget-source rows keep a MUI `Switch`, made inert — it never had an
`onChange`, the row's `onClick` is what toggles the setting — and the row
carries `aria-pressed` instead, which is the state the stray checkbox used to
announce on its own. A switch is a control worth owning the day something
needs a working one.

Every MUI `Menu`, `MenuList` and `MenuItem` is converted: the two context
menus, the envelope table menu, the transaction action bar, the filter bar, the
settings menu, and the selects whose options were `MenuItem`s.

`Select.tsx` is MUI's outlined `Select`. Its trigger goes inside
`OutlinedFieldFrame`, so the notched border and floating label are the same
ones the text field draws rather than a second copy of the geometry — that
extraction is why `OutlinedField` now has a frame at all. `MultiSelect` is the
same control with more than one value, which is the tag picker.

`onChange` hands over the value, not an event. MUI's `Select` reports through a
synthetic event whose `target` has to be rebuilt by hand to carry `name` and
`value`, which is the shape form libraries read — `SmartSelect` did that with
two `@ts-expect-error`s. Formik has `setFieldValue` for exactly this, and the
envelope edit dialog already used it for two other fields.

`options` is the whole list, and it is the only way to fill one: rows are data,
not children. Base UI resolves a row's label from its `SelectItemText`, which
does not exist until the list has been opened once, so a closed trigger shows
the raw value unless the labels are handed over up front — `options` is that
map as well as the rows. Every select in the app wants the same row anyway: a
label, sometimes a muted second line, and a tick when it is the chosen one.
Keeping the parts unexported is what makes the option type inferable from
`value`, so a row whose value is not in the union is a type error rather than a
cast at the call site. A row that needs more is a reason to widen the option,
not to reopen the component. The tag picker's rows used to carry an MUI
`Checkbox`, a form control inside a `role="option"` announcing a second
selected state beside the row's own; they carry the same tick as every other
select now.

`SmartSelect` is gone. Its two jobs were a mobile drawer, which the plain popup
replaces, and a history-backed open state, which `Select` keeps: the open list
goes on the popover stack, so Back closes it rather than leaving the page. The
key is generated, because nothing opens a select by name and all the stack
needs is that no two live selects share one.
`EnvelopeEditDialog.stories.tsx` covers the part nothing else does: that a
picked value reaches the form.

These files live beside the other shared components, not under
`6-shared/ui/shadcn`. `components.json` points the shadcn `ui` alias at that
directory, so anything named `button.tsx` or `input.tsx` there is a target
`shadcn add` will overwrite. The directory holds only `utils.ts` (`cn`), which
is the alias shadcn actually needs.

Each owned surface carries one accessible name, and they differ: the assignment
popover is named for its envelope, the amount field is `assigned`, and the quick
amounts list is `quickAmounts`. Repeating one label across the dialog, its input
and its action list makes a screen reader announce the same word three times.

`BudgetPopover` and `AmountInput` no longer import MUI. The shared theme still
supplies colors, the input border, the icon colour, elevation 8/16 and the
modal z-index through CSS variables.

Icons live in `6-shared/ui/feather`, built by an owned `createFeatherIcon` that
reproduces what MUI's `createSvgIcon` gave these glyphs: a `1em` box, the
`fontSize` and `color` props, stroke from `currentColor`. The whole Feather set
moved at once rather than one glyph at a time, so there is one factory instead
of two. `6-shared/ui/Icons.tsx` re-exports it along with the three glyphs that
have no Feather equivalent and still come from `@mui/icons-material`; import
from `feather` directly when a module must stay off MUI. The directory is
`feather/`, not `icons/`: `icons` and `Icons.tsx` are the same path on a
case-insensitive filesystem, and the two would resolve to different modules on
macOS and on CI.

`src/6-shared/ui/muiFree.test.ts` is what keeps that split honest. Reading a
Feather glyph through the mixed `Icons` barrel compiles, looks identical at the
call site, and quietly returns MUI to the bundle, so the test walks the whole
import graph of the owned set and fails with the chain that reached MUI. The
converted surfaces are checked on their own imports instead of transitively:
shared infrastructure has its own migration step and does not make a surface
itself an MUI consumer. Add a module to `OWNED` in that file when it is
converted.

Base UI is roughly 40-65 kB gzipped, and while both libraries ship the app pays
for MUI and Base UI at once. That is the budget for the coexistence period, not
a permanent state: keep the owned set to surfaces that have actually been
converted, and remove the MUI equivalent in the same change rather than leaving
two implementations of one control. `@mui/x-date-pickers` still remains in the
dependency graph only until package cleanup; its temporary `pnpm.overrides`
entry goes with that final removal.

Assignment dismissal via Escape/backdrop/swipe applies the draft, as do Enter,
the submit button and quick actions. An unchanged value emits no command.
Browser Back changes history without invoking that apply callback; Forward
restores the retained draft. Expression parsing and financial calculations are
unchanged.

The AmountInput stories compare outlined-field geometry and computed styles
against MUI in both sizes and themes. They cannot cover hover, because
synthetic pointer events do not set CSS `:hover`; the border's state
precedence and its weights are pinned by `OutlinedField.test.ts` instead. The
parity matrix uses a plain currency symbol for its adornment, which cannot tell
input focus and `:focus-within` apart, so `AdornmentButtonFocus` runs the same
comparison with a focusable adornment and checks the border against MUI on both
sides of a Tab. AdaptivePopover and
assignment stories cover dismissal, focus, scroll lock, keyboard/typeahead,
899/900px behavior, synthetic touch swipe, nested MUI drawers, history and
foreign-currency helper text. Existing dialog/transaction stories exercise the shared input's callers;
settings stories cover a MUI confirmation above the new overlay.

### Static compatibility

`stories/foundation/MuiTailwindInterop.stories.tsx` checks actual computed styles
for MUI/Tailwind coexistence, typography recipes, static Paper surfaces, icon
centering, and budget row alignment.
`ActivityStats.stories.tsx` checks the real income, expense, and transfer cards
with deterministic data in both themes.
The `ButtonTypography` story checks that a recipe inside a `ButtonBase` keeps
the themed font family only when `font-sans` is present, and `NativeMargins`
checks that a converted paragraph resets its user agent margins.
`TypographyColorProps` compares the `textSecondary` and `error` `color` props
against `text-muted-foreground` and `text-error` in both themes.
`InheritedWeight` checks that a recipe inside a `font-medium` container keeps
the weight its MUI variant declares.
The typography matrix compares every implemented recipe against its themed MUI
Typography variant in light and dark mode. Dedicated 899px and 900px stories
check both sides of the `md` breakpoint; the surface matrix compares default,
square, outlined, and elevation-10 contracts in both themes.

Run these with `pnpm test:storybook`. Rendering a story or passing TypeScript
alone does not establish visual parity; affected application routes also need
desktop/mobile and interaction checks.

`tools/ui-parity` compares a running route against the same route served from a
worktree of the last pre-Tailwind commit, over every text run and painted box on
the page. Stories cover contracts that are known; the harness is what finds the
properties nobody thought to check.

See the [MUI Tailwind v4 integration guide](https://mui.com/material-ui/integrations/tailwindcss/tailwindcss-v4/).

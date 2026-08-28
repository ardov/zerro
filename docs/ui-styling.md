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

`AdaptivePopover` composes Base UI Popover at 900px and above and Base UI
Drawer below 900px. Its app-owned props are `open`, `onClose`, `anchorEl`,
`drawerSide`, `container`, children, className and accessible labels.
`anchorEl` positions the desktop popover; `drawerSide` picks the edge the
mobile drawer slides in from and is ignored on desktop. History remains
controlled by `historyPopovers`; the component does not push or pop history
itself. Desktop positioning starts at the anchor's top-left with a 16px
collision margin. Mobile placement defaults to bottom; budget assignment uses
top. Focus restoration retains the external anchor through exit, but drops it
once it leaves the document — a retained node that has been unmounted can be
neither positioned against nor focused. Both variants render an `sr-only`
Close part: on desktop it also enables Base UI's modal focus trap. The CSS
contains placement/swipe transitions and a reduced-motion override.

`container` defaults to the MUI dialog or drawer the anchor sits in, so during
coexistence a surface opened from one stays inside its focus trap; pass `null`
to force it to the body. The lookup is `findMuiFocusBoundary` in
`6-shared/ui/muiFocusBoundary.ts` — the one place that reads MUI's class names,
kept as a named function so it is a single deletion once the last MUI overlay
is converted rather than a search. It is not a prop the call sites compute,
because the trigger's ancestry is not something they know either.

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

`ActionList` also carries the parts a MUI `MenuItem` was assembled from —
`ActionListItemIcon`, `ActionListItemText`, `ActionListItemAction`,
`ActionListSubheader`, `ActionListDivider`. They stay inside the ActionList
family rather than being published as a generic `ListItemIcon` or `Divider`,
because they carry this list's geometry and nothing else needs them.
`ActionListItemText` has no margin of its own: MUI's `ListItemText` does, but
`MenuItem` zeroes it, and a row that keeps it is 8px taller than the one it
replaced. `ActionList.stories.tsx` compares rows, icon slots, subheaders and
dividers against the MUI originals.

`OutlinedField` is MUI's outlined text field: the notched border with the label
cut into it. Its label is always floated, which is right for a field that
always holds a value; MUI's other mode, where an outlined label drops into an
empty field, is not implemented because nothing needs it yet. A text field that
can be empty gets that mode added here, not a second copy of the notch
geometry. `Field.Root` from Base UI supplies the label and description wiring
and the `data-invalid` / `data-disabled` state the stylesheet keys off, so none
of that is spelled out by hand. It is used by `AmountInput`; native props
target the input, while `className` lands on `Field.Root` and sizes the whole
field, label and helper text included. Use `startAdornment` and `endAdornment`
rather than MUI `slotProps`.

The focus ring keys off the input, not `:focus-within`. The group holds the
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

The `MenuList` and `MenuItem` still in the app are inside real MUI `Menu` and
`Select` popups — context menus, selects, the transaction top bar. Those are
menus in the sense `ActionList` deliberately is not, so they need a menu
component rather than this one.

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
their data layer legitimately reaches `@mui/x-date-pickers` through date
localization, which is not what the claim is about. Add a module to `OWNED` in
that file when it is converted.

Base UI is roughly 40-65 kB gzipped, and while both libraries ship the app pays
for MUI and Base UI at once. That is the budget for the coexistence period, not
a permanent state: keep the owned set to surfaces that have actually been
converted, and remove the MUI equivalent in the same change rather than leaving
two implementations of one control. `@mui/x-date-pickers` pulls its own older
`@base-ui/utils`; a `pnpm.overrides` pin collapses the two onto one copy, and
the pin comes out once the pickers catch up.

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

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

Colors, radii, and elevation shadows are derived from the active MUI theme.
`secondary` is the semantic selected-surface token, not MUI's secondary brand
color. MUI palette paths such as `text.disabled` are not CSS color values:
use a resolved color, a semantic utility, or keep dynamic palette lookup in
`sx`. MUI's `color` prop supports names such as `textDisabled`, not arbitrary
palette paths in the installed version: `<Typography color="text.disabled">`
renders no colour at all. `sx={{ color: 'text.disabled' }}` does work, because
`sx` is the system. A converted element that turns such a prop into a real token
class makes text change colour that never changed before, so check what the
element actually rendered before carrying the intent across.

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

`cn()` uses the default `tailwind-merge` configuration, which does not know the
custom `type-*` group. Do not expect `cn('type-body', 'type-title')` to select
the last recipe; select one recipe explicitly. Class-string order alone is not
a CSS precedence rule.

## Regression checks

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

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
palette paths in the installed version.

Use `cn()` when caller classes override a component's default utility classes.
`clsx()` only concatenates classes: the last class in an HTML attribute does not
necessarily win. Budget group rows, for example, override `items-center` with
`items-baseline`. Grid `justify-start` is not equivalent to `justifyContent:
'initial'`: it prevents an `auto` track from stretching.

## Regression checks

`stories/foundation/MuiTailwindInterop.stories.tsx` checks actual computed styles
for MUI/Tailwind coexistence, icon centering, and budget row alignment.
`ActivityStats.stories.tsx` checks the real income, expense, and transfer cards
with deterministic data in both themes.

Run these with `pnpm test:storybook`. Rendering a story or passing TypeScript
alone does not establish visual parity; affected application routes also need
desktop/mobile and interaction checks.

See the [MUI Tailwind v4 integration guide](https://mui.com/material-ui/integrations/tailwindcss/tailwindcss-v4/).

# UI Kit

Theme Tailwind: `theme.css`. Showcase: Storybook → UI Kit → Foundations.
Light and dark palettes OKLCH, text 16 and 14 px. Tailwind utilities with `ui-` prefix.

Plan: `private/work/ui-kit/spec.md`, section «Plan».
File is in the main checkout and not in the public repository.

## Guidelines

- Write documentation and stories in English.
- Keep the props type visible in the function signature: `function Component(props: ComponentProps)`.
  Destructure props as the first statement inside the function; name the remaining
  properties `restProps`.
- Don't preserve backward compatibility with previous versions of the kit.
- Use shadcn/ui and Base UI as references, not blueprints. Keep our own theme
  and geometry; simplify APIs for actual Zerro use cases and avoid unnecessary complexity.
- Prefer modern CSS over JavaScript where practical. Target the latest two
  stable versions of major browsers.
- Highlight decisions and trade-offs that introduce additional complexity over Base UI or other frameworks.
- Split long Tailwind class lists across lines and group related utilities by
  purpose when it improves readability.
- Use semantic Tailwind tokens from `theme.css` for shared styling. Add
  `rounded-smooth` alongside radius utilities on rounded surfaces; the shared
  utility defines the corner shape, while the radius controls its size.
- Preserve keyboard access, visible focus, accessible names, and reduced-motion
  behavior.

Arrow navigation in lists stops at either end. Menu, ContextMenu, SelectSearch
and ActionList pass `loopFocus={false}`; Base UI Select does not loop by default.

## Component documentation

Keep brief component documentation in its `.stories.tsx`: purpose, a minimal
example, and important usage rules or limitations. Use prop comments for
non-obvious options and implementation comments for technical decisions.
This README holds shared guidelines; plans and open questions stay private.

## Select popup history

`Select` and `MultiSelect` require `OverlayHost` inside a Router. The host owns
opening and closing; Back dismisses the top popup before its parent overlay.
For programmatic control, pass `popup={popup}` where `popup = usePopup()`.
The controller exposes `open`, `setOpen`, `subscribeClose`, and `release`.
Do not substitute local state: the popup must participate in host history.
Without this prop the select creates its own popup control. Arbitrary
`open` / `onOpenChange` props are not part of the select API.

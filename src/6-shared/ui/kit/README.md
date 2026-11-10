# UI Kit

Run `pnpm storybook` and open **UI Kit → Welcome** for examples or **Foundations** for theme roles. Keep component usage and limitations in its English stories. Document non-obvious props at their declaration.

Use semantic tokens from [theme.css](theme.css) and pair radius utilities with `rounded-smooth`. Prefer native button and link semantics. Arrow navigation stops at list ends. Keep keyboard focus, explicit names and reduced motion working in both themes.

Keep props visible in the signature (`function Component(props: ComponentProps)`), destructure in the body and call forwarded properties `restProps`. Expose variants used by actual callers. Group long utility lists by purpose.

For history-controlled selects, pass `popup={popup}` from `usePopup()`. The default select owns its own registration. Both need an `OverlayHost` inside the router. For surface ownership, scroll and focus rules see [UI conventions](../../../../docs/ui-styling.md).

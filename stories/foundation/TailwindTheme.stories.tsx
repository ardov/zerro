import type { Meta, StoryObj } from '@storybook/react-vite'
import { radius } from '6-shared/ui/theme/palette'

const meta = {
  title: 'Foundation/Tailwind compatibility theme',
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo' },
  },
} satisfies Meta

export default meta
type Story = StoryObj

const colorTokens = [
  ['background', 'palette.background.default'],
  ['foreground', 'palette.text.primary'],
  ['card', 'palette.background.paper'],
  ['card-foreground', 'palette.text.primary'],
  ['popover', 'palette.background.paper'],
  ['popover-foreground', 'palette.text.primary'],
  ['primary', 'palette.primary.main'],
  ['primary-foreground', 'palette.getContrastText(primary.main)'],
  ['secondary', 'palette.action.selected'],
  ['secondary-foreground', 'palette.text.primary'],
  ['muted', 'palette.action.hover'],
  ['muted-foreground', 'palette.text.secondary'],
  ['accent', 'palette.action.hover'],
  ['accent-foreground', 'palette.text.primary'],
  ['destructive', 'palette.error.main'],
  ['destructive-foreground', 'palette.getContrastText(error.main)'],
  ['border', 'palette.divider'],
  ['input', 'palette.divider'],
  ['ring', 'palette.primary.main'],
  ['interactive', 'palette.secondary.main'],
  ['interactive-foreground', 'palette.getContrastText(secondary.main)'],
  ['success', 'palette.success.main'],
  ['success-foreground', 'palette.getContrastText(success.main)'],
  ['warning', 'palette.warning.main'],
  ['warning-foreground', 'palette.getContrastText(warning.main)'],
  ['info', 'palette.info.main'],
  ['info-foreground', 'palette.getContrastText(info.main)'],
  ['error', 'palette.error.main'],
  ['error-foreground', 'palette.getContrastText(error.main)'],
  ['disabled-foreground', 'palette.text.disabled'],
] as const

function ThemeFoundation() {
  return (
    <main className="min-h-screen bg-background p-6 font-sans text-foreground">
      <div className="mx-auto grid max-w-5xl gap-8">
        <header className="grid gap-2">
          <h1 className="text-2xl font-semibold">
            Tailwind compatibility theme
          </h1>
          <p className="text-sm text-muted-foreground">
            Four-pixel spacing and semantic tokens resolved from the active
            color scheme.
          </p>
        </header>

        <section aria-labelledby="spacing-heading" className="grid gap-4">
          <h2 id="spacing-heading" className="text-lg font-medium">
            Spacing grid
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            {[1, 2, 3, 4, 6, 8, 10].map(step => (
              <figure key={step} className="grid justify-items-center gap-2">
                <div
                  className="bg-interactive"
                  style={{ width: step * 4, height: step * 4 }}
                />
                <figcaption className="text-xs text-muted-foreground">
                  {step} / {step * 4}px
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section aria-labelledby="colors-heading" className="grid gap-4">
          <h2 id="colors-heading" className="text-lg font-medium">
            Semantic colors
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colorTokens.map(([token, source]) => (
              <li
                key={token}
                className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground"
              >
                <div
                  className="h-16"
                  style={{ backgroundColor: `var(--${token})` }}
                />
                <div className="grid gap-1 p-4">
                  <strong className="text-sm">{token}</strong>
                  <code className="text-xs text-muted-foreground">
                    {source}
                  </code>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="shape-heading"
          className="grid gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground"
        >
          <h2 id="shape-heading" className="text-lg font-medium">
            Shape and typography
          </h2>
          <p>
            IBM Plex Sans · radius {String(radius)}px · Tailwind radius-lg
          </p>
          <div className="h-12 rounded-lg border border-border bg-muted" />
        </section>
      </div>
    </main>
  )
}

export const Light: Story = { render: () => <ThemeFoundation /> }

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => <ThemeFoundation />,
}

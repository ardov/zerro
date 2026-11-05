import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Logo } from '@/6-shared/ui/Logo'
import { useColorScheme } from '@/6-shared/ui/theme'
import { getThemeColorShowcase } from '@/6-shared/ui/theme/colors'

const meta = {
  title: 'Foundations/Theme',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj

const statuses = ['success', 'warning', 'info', 'error']

const token = (name: string) => `var(--${name})`

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="m-0 text-title font-sans">{title}</h2>
      {children}
    </section>
  )
}

function ScaleRows({ rows }: { rows: { name: string; colors: string[] }[] }) {
  return (
    <div className="grid gap-2">
      {rows.map(row => (
        <div
          key={row.name}
          className="grid items-center gap-2 sm:grid-cols-[8rem_1fr]"
        >
          <span className="text-caption text-ui-secondary">{row.name}</span>
          <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-ui-border">
            {row.colors.map((color, index) => (
              <div
                key={`${color}-${index}`}
                className="h-10"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RoleCard({ name }: { name: string }) {
  const foreground = token(`color-ui-on-${name}`)
  return (
    <article className="grid gap-2 rounded-lg border border-ui-border bg-ui-card p-3">
      <div
        className="rounded-md p-3 text-body-sm"
        style={{
          backgroundColor: token(`color-ui-${name}-solid`),
          color: foreground,
        }}
      >
        {name} solid
      </div>
      {(name === 'warning' || name === 'error') && (
        <div
          className="rounded-md border p-3 text-body-sm"
          style={{
            backgroundColor: token(`${name}-surface`),
            borderColor: token(`${name}-border`),
            color: token(name),
          }}
        >
          Legacy warning surface and border
        </div>
      )}
    </article>
  )
}

function ThemeShowcase() {
  const { mode } = useColorScheme()
  const showcase = getThemeColorShowcase(mode)

  return (
    <main className="min-h-screen bg-ui-base p-4 font-sans text-ui-primary sm:p-8">
      <div className="mx-auto grid max-w-6xl gap-10">
        <header className="grid gap-3">
          <Logo fill="var(--color-ui-primary)" width={220} />
          <div>
            <h1 className="m-0 text-display">Theme Showcase</h1>
            <p className="m-0 text-body text-ui-secondary">
              {mode} scheme · UI Kit roles alongside the retained chart and
              warning palette
            </p>
          </div>
        </header>

        <Section title="Concrete color scales">
          <ScaleRows rows={showcase.concreteScales} />
        </Section>

        <Section title="Semantic scales">
          <ScaleRows rows={showcase.semanticScales} />
        </Section>

        <Section title="Semantic levels on neutral">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {showcase.levels.map(({ name, level, color }) => (
              <div
                key={name}
                className="overflow-hidden rounded-lg border border-ui-border bg-ui-card"
              >
                <div className="h-12" style={{ backgroundColor: color }} />
                <div className="p-2 text-caption">
                  <div>{name}</div>
                  <div className="text-ui-secondary">{level.toFixed(3)}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Status roles">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {statuses.map(name => (
              <RoleCard key={name} name={name} />
            ))}
          </div>
        </Section>

        <Section title="Interaction states">
          <div className="grid gap-3 rounded-lg border border-ui-border bg-ui-card p-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['hover', '--color-ui-highlight'],
              ['pressed', '--color-ui-pressed'],
              ['selected', '--color-ui-selected'],
              ['disabled', '--color-ui-highlight'],
            ].map(([label, background]) => (
              <button
                key={label}
                disabled={label === 'disabled'}
                className="focusable min-h-11 rounded-lg border border-ui-border px-4 text-body text-ui-primary disabled:opacity-ui-disabled"
                style={{ backgroundColor: `var(${background})` }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Representative UI">
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-lg bg-ui-card text-ui-primary grid gap-4 border border-ui-border p-5 shadow-elevation-1">
              <div>
                <h3 className="m-0 text-title">August budget</h3>
                <p className="m-0 text-body-sm text-ui-secondary">
                  A deliberately long envelope label wraps without losing its
                  hierarchy or status colour.
                </p>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3 border-t border-ui-border pt-3">
                <span className="text-body">
                  Rent and shared household costs
                </span>
                <strong className="text-body">24 850,00 Kč</strong>
                <span className="text-body text-ui-secondary">Available</span>
                <span className="text-body text-ui-success">3 240,00 Kč</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-lg border-0 bg-ui-button-primary px-4 py-2 text-body-sm text-ui-on-button-primary"
                  type="button"
                >
                  Save changes
                </button>
                <button
                  className="rounded-lg border border-ui-border bg-transparent px-4 py-2 text-body-sm text-ui-primary"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </article>

            <article className="rounded-lg bg-ui-card text-ui-primary grid gap-4 border border-ui-border p-5 shadow-elevation-1">
              <div className="rounded-lg border border-error-border bg-error-surface p-3 text-error">
                <strong className="text-body-sm">Import needs attention</strong>
                <p className="m-0 text-caption">
                  One account could not be matched automatically.
                </p>
              </div>
              <div
                aria-label="Representative chart palette"
                className="flex h-28 items-end gap-2 border-b border-ui-border"
              >
                {[
                  ['--data-primary', '45%'],
                  ['--data-primary-alt', '72%'],
                  ['--data-success', '58%'],
                  ['--data-error', '82%'],
                  ['--data-error-alt', '36%'],
                ].map(([color, height]) => (
                  <div
                    key={color}
                    className="min-w-7 flex-1 rounded-t-sm"
                    style={
                      {
                        backgroundColor: `var(${color})`,
                        height,
                      } as CSSProperties
                    }
                    title={color}
                  />
                ))}
              </div>
              <p className="m-0 text-caption text-ui-tertiary">
                Tertiary helper copy is quieter than secondary body text.
              </p>
            </article>
          </div>
        </Section>
      </div>
    </main>
  )
}

export const Showcase: Story = { render: () => <ThemeShowcase /> }

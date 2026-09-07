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

const statuses = [
  'primary',
  'interactive',
  'success',
  'warning',
  'info',
  'error',
]

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
          <span className="text-caption text-muted-foreground">{row.name}</span>
          <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-border">
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
  const foreground = token(`${name}-foreground`)
  return (
    <article className="grid gap-2 rounded-lg border border-border bg-card p-3">
      <div
        className="rounded-md p-3 text-body-sm"
        style={{ backgroundColor: token(name), color: foreground }}
      >
        {name} solid
      </div>
      <div
        className="rounded-md border p-3 text-body-sm"
        style={{
          backgroundColor: token(`${name}-surface`),
          borderColor: token(`${name}-border`),
          color: token(name),
        }}
      >
        transparent hover and border
      </div>
    </article>
  )
}

function ThemeShowcase() {
  const { mode } = useColorScheme()
  const showcase = getThemeColorShowcase(mode)

  return (
    <main className="min-h-screen bg-background p-4 font-sans text-foreground sm:p-8">
      <div className="mx-auto grid max-w-6xl gap-10">
        <header className="grid gap-3">
          <Logo fill="var(--primary)" width={220} />
          <div>
            <h1 className="m-0 text-display">Theme Showcase</h1>
            <p className="m-0 text-body text-muted-foreground">
              {mode} scheme · long labels, money and controls share one semantic
              colour pipeline
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
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="h-12" style={{ backgroundColor: color }} />
                <div className="p-2 text-caption">
                  <div>{name}</div>
                  <div className="text-muted-foreground">
                    {level.toFixed(3)}
                  </div>
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
          <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['hover', '--accent'],
              ['focus', '--focus-surface'],
              ['selected', '--selected'],
              ['disabled', '--disabled-background'],
            ].map(([label, background]) => (
              <button
                key={label}
                className="min-h-11 rounded-lg border border-border-strong px-4 text-body text-foreground"
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
            <article className="rounded-lg bg-card text-card-foreground grid gap-4 border border-border p-5 shadow-elevation-1">
              <div>
                <h3 className="m-0 text-title">August budget</h3>
                <p className="m-0 text-body-sm text-muted-foreground">
                  A deliberately long envelope label wraps without losing its
                  hierarchy or status colour.
                </p>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3 border-t border-border pt-3">
                <span className="text-body">
                  Rent and shared household costs
                </span>
                <strong className="text-body">24 850,00 Kč</strong>
                <span className="text-body text-muted-foreground">
                  Available
                </span>
                <span className="text-body text-success">3 240,00 Kč</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-lg border-0 bg-primary px-4 py-2 text-body-sm text-primary-foreground"
                  type="button"
                >
                  Save changes
                </button>
                <button
                  className="rounded-lg border border-primary-border bg-transparent px-4 py-2 text-body-sm text-primary"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </article>

            <article className="rounded-lg bg-card text-card-foreground grid gap-4 border border-border p-5 shadow-elevation-1">
              <div className="rounded-lg border border-error-border bg-error-surface p-3 text-error">
                <strong className="text-body-sm">Import needs attention</strong>
                <p className="m-0 text-caption">
                  One account could not be matched automatically.
                </p>
              </div>
              <div
                aria-label="Representative chart palette"
                className="flex h-28 items-end gap-2 border-b border-border"
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
              <p className="m-0 text-caption text-disabled-foreground">
                Disabled helper copy and chart axes remain quieter than muted
                body text.
              </p>
            </article>
          </div>
        </Section>
      </div>
    </main>
  )
}

export const Showcase: Story = { render: () => <ThemeShowcase /> }

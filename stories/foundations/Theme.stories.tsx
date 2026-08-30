import type { Meta, StoryObj } from '@storybook/react-vite'
import { Logo } from '6-shared/ui/Logo'

const meta = {
  title: 'Foundations/Theme',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj

/** Each swatch is a token and the token written to sit on it, which is the
 * pairing the app actually renders — not a contrast recomputed for the
 * catalogue and able to disagree with it. */
const colors = [
  ['primary', 'var(--primary)', 'var(--primary-foreground)'],
  ['secondary', 'var(--interactive)', 'var(--interactive-foreground)'],
  ['success', 'var(--success)', 'var(--success-foreground)'],
  ['warning', 'var(--warning)', 'var(--warning-foreground)'],
  ['error', 'var(--error)', 'var(--error-foreground)'],
  ['background', 'var(--background)', 'var(--foreground)'],
] as const

function ThemeCatalog() {
  return (
    <main className="grid gap-6 p-8">
      <Logo fill="var(--primary)" width={220} />
      <section>
        <h1 className="type-display font-sans">Typography</h1>
        <h2 className="type-title font-sans">
          Envelope budgeting with clarity
        </h2>
        <p className="type-body font-sans text-muted-foreground">
          Long labels, secondary text and monetary values should remain legible.
        </p>
      </section>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {colors.map(([name, background, foreground]) => (
          <li
            key={name}
            className="h-18 w-28 rounded-lg p-2"
            style={{ backgroundColor: background, color: foreground }}
          >
            <span className="type-caption font-sans">{name}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}

export const Catalog: Story = { render: () => <ThemeCatalog /> }

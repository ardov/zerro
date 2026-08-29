import type { Meta, StoryObj } from '@storybook/react-vite'
import { getContrastText, useAppTheme } from '6-shared/ui/theme'
import { Logo } from '6-shared/ui/Logo'

const meta = {
  title: 'Foundations/Theme',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj

function ThemeCatalog() {
  const theme = useAppTheme()
  const colors = [
    ['primary', theme.palette.primary.main],
    ['secondary', theme.palette.secondary.main],
    ['success', theme.palette.success.main],
    ['warning', theme.palette.warning.main],
    ['error', theme.palette.error.main],
    ['background', theme.palette.background.default],
  ] as const

  return (
    <main className="grid gap-6 p-8">
      <Logo fill={theme.palette.primary.main} width={220} />
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
        {colors.map(([name, color]) => (
          <li
            key={name}
            className="h-18 w-28 rounded-lg p-2"
            style={{
              backgroundColor: color,
              color: getContrastText(color),
            }}
          >
            <span className="type-caption font-sans">{name}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}

export const Catalog: Story = { render: () => <ThemeCatalog /> }

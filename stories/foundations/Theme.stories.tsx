import type { Meta, StoryObj } from '@storybook/react-vite'
import { Typography } from '@mui/material'
import { useAppTheme } from '6-shared/ui/theme'
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
        <Typography variant="h4">Typography</Typography>
        <Typography variant="h6">Envelope budgeting with clarity</Typography>
        <Typography variant="body1" color="text.secondary">
          Long labels, secondary text and monetary values should remain legible.
        </Typography>
      </section>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {colors.map(([name, color]) => (
          <li
            key={name}
            className="h-18 w-28 rounded-lg p-2"
            style={{
              backgroundColor: color,
              color: theme.palette.getContrastText(color),
            }}
          >
            <Typography variant="caption">{name}</Typography>
          </li>
        ))}
      </ul>
    </main>
  )
}

export const Catalog: Story = { render: () => <ThemeCatalog /> }

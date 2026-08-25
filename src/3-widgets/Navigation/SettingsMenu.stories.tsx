import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box } from '@mui/material'
import { MenuButton } from './MenuButton'

const meta = {
  title: 'Navigation/Settings menu',
  component: MenuButton,
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', globalWidgets: true },
  },
} satisfies Meta<typeof MenuButton>

export default meta
type Story = StoryObj

export const Desktop: Story = {
  args: { showLinks: true },
  render: args => (
    <Box sx={{ minHeight: 360 }}>
      <MenuButton {...args} />
    </Box>
  ),
}

export const Mobile: Story = {
  globals: { viewport: { value: 'iphone13' } },
  args: { showLinks: true },
  render: args => <MenuButton {...args} />,
}

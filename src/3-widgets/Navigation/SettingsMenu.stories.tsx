import type { Meta, StoryObj } from '@storybook/react-vite'
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
    <div className="min-h-[360px]">
      <MenuButton {...args} />
    </div>
  ),
}

export const Mobile: Story = {
  globals: { viewport: { value: 'iphone13' } },
  args: { showLinks: true },
  render: args => <MenuButton {...args} />,
}

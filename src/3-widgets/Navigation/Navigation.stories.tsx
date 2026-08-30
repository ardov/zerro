import type { Meta, StoryObj } from '@storybook/react-vite'
import NavigationDrawer from './NavDrawer'
import { MobileNavigation } from './MobileNavigation'

const meta = {
  title: 'App/Navigation',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', globalWidgets: true },
  },
} satisfies Meta

export default meta
type Story = StoryObj

export const DesktopDrawer: Story = {
  render: () => (
    <div className="flex min-h-[720px] bg-background">
      <NavigationDrawer />
      <div className="grow" />
    </div>
  ),
}

export const MobileBottomNavigation: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => (
    <div className="flex min-h-[600px] flex-col bg-background">
      <MobileNavigation />
    </div>
  ),
}

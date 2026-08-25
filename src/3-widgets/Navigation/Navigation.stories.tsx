import type { Meta, StoryObj } from '@storybook/react-vite'
import { Drawer } from '@mui/material'
import NavigationDrawer from './NavDrawer'
import { MobileNavigation } from './MobileNavigation'

const meta = {
  title: 'Navigation/Shell',
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', globalWidgets: true },
  },
} satisfies Meta

export default meta
type Story = StoryObj

export const DesktopDrawer: Story = {
  render: () => (
    <div className="min-h-[720px] bg-background">
      <NavigationDrawer
        open
        variant="permanent"
        slotProps={{ paper: { sx: { width: 280, position: 'relative' } } }}
      />
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

export const DrawerSurface: Story = {
  render: () => (
    <Drawer open variant="persistent" anchor="left">
      <div className="w-[280px]">
        <NavigationDrawer open variant="permanent" />
      </div>
    </Drawer>
  ),
}

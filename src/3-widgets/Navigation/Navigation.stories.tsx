import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Drawer, Stack } from '@mui/material'
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
    <Box sx={{ minHeight: 720, bgcolor: 'background.default' }}>
      <NavigationDrawer
        open
        variant="permanent"
        slotProps={{ paper: { sx: { width: 280, position: 'relative' } } }}
      />
    </Box>
  ),
}

export const MobileBottomNavigation: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => (
    <Stack sx={{ minHeight: 600, bgcolor: 'background.default' }}>
      <MobileNavigation />
    </Stack>
  ),
}

export const DrawerSurface: Story = {
  render: () => (
    <Drawer open variant="persistent" anchor="left">
      <Box sx={{ width: 280 }}>
        <NavigationDrawer open variant="permanent" />
      </Box>
    </Drawer>
  ),
}

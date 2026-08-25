import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button, Paper, Typography } from '@mui/material'
import { AdaptivePopover } from './AdaptivePopover'

const meta = {
  title: 'UI/Adaptive popover',
  component: AdaptivePopover,
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo' },
  },
} satisfies Meta<typeof AdaptivePopover>

export default meta
type Story = StoryObj

function PopoverHarness() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)
  return (
    <>
      <Button ref={setAnchorEl} variant="outlined">
        Open adaptive surface
      </Button>
      <AdaptivePopover
        open={open}
        anchorEl={anchorEl}
        anchor="bottom"
        onClose={() => setAnchorEl(null)}
      >
        <Paper className="min-w-[280px] p-6">
          <Typography variant="h6">Responsive popover</Typography>
          <Typography color="text.secondary">
            Popover on desktop, swipeable drawer on mobile.
          </Typography>
        </Paper>
      </AdaptivePopover>
    </>
  )
}

export const Desktop: Story = { render: () => <PopoverHarness /> }

export const MobileDrawer: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => <PopoverHarness />,
}

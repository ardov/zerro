import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack } from '@mui/material'
import { PercentBar } from './PercentBar'
import { RadialProgress } from './RadialProgress'

const meta = {
  title: 'UI/Progress',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta
type Story = StoryObj

const data = [
  { id: 'food', amount: 420, color: '#fb8c00', name: 'Food' },
  { id: 'transport', amount: 180, color: '#1e88e5', name: 'Transport' },
  { id: 'bills', amount: 240, color: '#8e24aa', name: 'Bills' },
]

export const PercentBars: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: 360 }}>
      <PercentBar data={data} />
      <PercentBar data={data} visibleData={data.slice(0, 2)} height="12px" />
    </Stack>
  ),
}

export const RadialProgressStates: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <RadialProgress value={0} size={64} />
      <RadialProgress value={0.55} size={64} />
      <RadialProgress value={1} size={64} />
    </Stack>
  ),
}

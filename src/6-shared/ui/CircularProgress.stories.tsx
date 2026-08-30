import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircularProgress } from './CircularProgress'

const meta = {
  title: 'Library/Display/CircularProgress',
  component: CircularProgress,
  tags: ['autodocs'],
  args: { size: 40 },
} satisfies Meta<typeof CircularProgress>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex gap-8">
      <CircularProgress />
      <CircularProgress size={24} />
    </div>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { RadialProgress } from './RadialProgress'

const meta = {
  title: 'Library/Display/RadialProgress',
  component: RadialProgress,
  tags: ['autodocs'],
  args: { size: 64, value: 0.55 },
} satisfies Meta<typeof RadialProgress>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Active: Story = {
  args: { active: true },
}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex gap-4">
      <RadialProgress value={0} size={64} />
      <RadialProgress value={0.55} size={64} />
      <RadialProgress value={0.55} size={64} active />
      <RadialProgress value={1} size={64} />
    </div>
  ),
}

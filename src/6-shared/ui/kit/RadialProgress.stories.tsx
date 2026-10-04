import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { RadialProgress } from './RadialProgress'

const meta = {
  title: 'UI Kit/Feedback/RadialProgress',
  component: RadialProgress,
  tags: ['autodocs'],
  args: { size: 64, value: 0.55, 'aria-label': 'Progress' },
  parameters: {
    docs: {
      description: {
        component:
          'A radial indicator for goals and ongoing work. Pass value from 0 to 1 for known progress; omit value for indeterminate loading. active adds a moving orbit to known progress. Supply an accessible label for standalone indicators; unlabeled indicators are decorative.',
      },
    },
  },
} satisfies Meta<typeof RadialProgress>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('progressbar')
    ).toHaveAttribute('aria-valuenow', '0.55')
  },
}

export const Loading: Story = {
  args: { value: undefined, size: 40, 'aria-label': 'Loading' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('progressbar', { name: 'Loading' })
    ).not.toHaveAttribute('aria-valuenow')
  },
}

export const Complete: Story = {
  args: { value: 1 },
}

export const Active: Story = {
  args: { active: true },
}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex gap-4">
      <RadialProgress size={40} />
      <RadialProgress size={24} />
      <RadialProgress value={0} size={64} />
      <RadialProgress value={0.55} size={64} />
      <RadialProgress value={0.55} size={64} active />
      <RadialProgress value={1} size={64} />
    </div>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { PercentBar, type PercentBarItem } from './PercentBar'

const data: PercentBarItem[] = [
  { id: 'food', amount: 420, color: '#fb8c00', name: 'Food' },
  { id: 'transport', amount: 180, color: '#1e88e5', name: 'Transport' },
  { id: 'bills', amount: 240, color: '#8e24aa', name: 'Bills' },
]

const meta = {
  title: 'Library/Display/PercentBar',
  component: PercentBar,
  tags: ['autodocs'],
  args: { data, className: 'w-[360px]' },
} satisfies Meta<typeof PercentBar>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex w-[360px] flex-col gap-4">
      <PercentBar data={data} />
      <PercentBar data={data} visibleData={data.slice(0, 2)} height="12px" />
    </div>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { TagIcon } from './TagIcon'

const meta = {
  title: 'Library/Display/TagIcon',
  component: TagIcon,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { color: '#e53935', size: 'm', symbol: '🍎' },
} satisfies Meta<typeof TagIcon>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex gap-2">
      <TagIcon symbol="🍎" color="#e53935" size="s" />
      <TagIcon symbol="🚲" color="#1e88e5" size="m" />
      <TagIcon symbol="💼" size="m" button />
    </div>
  ),
}

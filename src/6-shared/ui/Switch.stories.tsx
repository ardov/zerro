import type { Meta, StoryObj } from '@storybook/react-vite'
import { Switch } from './Switch'

const meta = {
  title: 'Library/Input/Switch',
  component: Switch,
  tags: ['autodocs'],
  args: { checked: false, edge: 'end' },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex flex-col gap-4">
      <Switch edge="end" />
      <Switch edge="end" checked />
    </div>
  ),
}

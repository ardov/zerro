import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox, CheckboxField } from './Checkbox'

const meta = {
  title: 'Library/Input/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: { checked: true },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex flex-col gap-3">
      <Checkbox checked />
      <CheckboxField label="Keep income" checked />
    </div>
  ),
}

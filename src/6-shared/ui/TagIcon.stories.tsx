import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { TagIcon } from './TagIcon'

const meta = {
  title: 'UI/TagIcon',
  component: TagIcon,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TagIcon>

export default meta
type Story = StoryObj

export const EmojiVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <TagIcon symbol="🍎" color="#e53935" size="s" />
      <TagIcon symbol="🚲" color="#1e88e5" size="m" />
      <TagIcon symbol="💼" size="m" button />
    </div>
  ),
}

export const Selectable: Story = {
  render: () => {
    const SelectableIcon = () => {
      const [checked, setChecked] = useState(false)
      return (
        <TagIcon
          symbol="🍲"
          color="#fb8c00"
          size="m"
          showCheckBox
          checked={checked}
          onChange={event => setChecked(event.target.checked)}
        />
      )
    }
    return <SelectableIcon />
  },
}
